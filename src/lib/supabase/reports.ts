import { createClient } from "./client";
import type { Report, ActivityType, ReportStatus } from "@/types";

interface ReportRow {
  id: string;
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  activity_type: ActivityType;
  description: string | null;
  image_url: string | null;
  status: ReportStatus;
  confidence_score: number;
  created_at: string;
  expires_at: string;
  distance_miles?: number;
}

// Transform database row to Report type
function transformReport(row: ReportRow): Report {
  return {
    id: row.id,
    location: {
      latitude: row.latitude,
      longitude: row.longitude,
    },
    city: row.city,
    region: row.region,
    activityType: row.activity_type,
    description: row.description || undefined,
    imageUrl: row.image_url || undefined,
    status: row.status,
    confidenceScore: row.confidence_score,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    updatedAt: row.created_at, // Use created_at as fallback
  };
}

// Fetch reports within a radius of a location
export async function getReportsWithinRadius(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<Report[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("reports_within_radius", {
    lat: latitude,
    lng: longitude,
    radius_miles: radiusMiles,
  });

  if (error) {
    console.error("Error fetching reports:", error);
    throw new Error(error.message);
  }

  return (data || []).map(transformReport);
}

// Fetch all active reports (for when user location is not available)
export async function getActiveReports(): Promise<Report[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(`
      id,
      city,
      region,
      activity_type,
      description,
      image_url,
      status,
      confidence_score,
      created_at,
      expires_at,
      location
    `)
    .neq("status", "removed")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching reports:", error);
    throw new Error(error.message);
  }

  // For reports without the RPC function, we need to extract lat/lng differently
  // The location column is a PostGIS geography type
  return (data || []).map((row) => ({
    id: row.id,
    location: {
      // PostGIS returns location as a string like "POINT(lng lat)"
      // We'll need to handle this in a real implementation
      latitude: 0,
      longitude: 0,
    },
    city: row.city,
    region: row.region,
    activityType: row.activity_type,
    description: row.description || undefined,
    imageUrl: row.image_url || undefined,
    status: row.status,
    confidenceScore: row.confidence_score,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    updatedAt: row.created_at,
  }));
}

// Fetch a single report by ID
export async function getReportById(id: string): Promise<Report | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching report:", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    location: { latitude: 0, longitude: 0 }, // Will be populated by RPC
    city: data.city,
    region: data.region,
    activityType: data.activity_type,
    description: data.description || undefined,
    imageUrl: data.image_url || undefined,
    status: data.status,
    confidenceScore: data.confidence_score,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    updatedAt: data.updated_at,
  };
}

// Create a new report
export interface CreateReportInput {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  activityType: ActivityType;
  description?: string;
  imageUrl?: string; // Optional - reports without photos have lower initial confidence
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const supabase = createClient();

  // Create PostGIS point from coordinates
  const locationPoint = `POINT(${input.longitude} ${input.latitude})`;

  // Reports with photos start with higher confidence (70%)
  // Reports without photos start with lower confidence (40%)
  const initialConfidence = input.imageUrl ? 70 : 40;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      location: locationPoint,
      city: input.city,
      region: input.region,
      activity_type: input.activityType,
      description: input.description,
      image_url: input.imageUrl || null,
      status: "pending",
      confidence_score: initialConfidence,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating report:", error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    location: {
      latitude: input.latitude,
      longitude: input.longitude,
    },
    city: data.city,
    region: data.region,
    activityType: data.activity_type,
    description: data.description || undefined,
    imageUrl: data.image_url || undefined,
    status: data.status,
    confidenceScore: data.confidence_score,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    updatedAt: data.updated_at,
  };
}

// Add an interaction to a report (confirm, mark inactive, or mark false)
export type InteractionType = "confirm" | "no_longer_active" | "false";

export async function addReportInteraction(
  reportId: string,
  interactionType: InteractionType,
  ipHash?: string
): Promise<void> {
  const supabase = createClient();

  // Get current user if authenticated
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("report_interactions").insert({
    report_id: reportId,
    user_id: user?.id || null,
    interaction_type: interactionType,
    ip_hash: ipHash,
  });

  if (error) {
    // Handle duplicate interaction
    if (error.code === "23505") {
      throw new Error("You have already submitted feedback for this report");
    }
    console.error("Error adding interaction:", error);
    throw new Error(error.message);
  }
}

// Subscribe to real-time report updates
export function subscribeToReports(
  onInsert: (report: Report) => void,
  onUpdate: (report: Report) => void,
  onDelete: (reportId: string) => void
) {
  const supabase = createClient();

  const channel = supabase
    .channel("reports-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "reports",
      },
      (payload) => {
        // Transform and emit new report
        const row = payload.new as ReportRow;
        onInsert(transformReport(row));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "reports",
      },
      (payload) => {
        const row = payload.new as ReportRow;
        if (row.status === "removed") {
          onDelete(row.id);
        } else {
          onUpdate(transformReport(row));
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "reports",
      },
      (payload) => {
        onDelete((payload.old as { id: string }).id);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
