"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getReportsWithinRadius,
  subscribeToReports,
  addReportInteraction,
  type InteractionType,
} from "@/lib/supabase/reports";
import type { Report, GeoLocation } from "@/types";

interface UseReportsOptions {
  location?: GeoLocation | null;
  radiusMiles?: number;
  autoRefreshInterval?: number; // in milliseconds, 0 to disable
}

interface UseReportsReturn {
  reports: Report[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addInteraction: (reportId: string, type: InteractionType) => Promise<void>;
}

export function useReports(options: UseReportsOptions = {}): UseReportsReturn {
  const {
    location,
    radiusMiles = 25,
    autoRefreshInterval = 60000, // Default: refresh every minute
  } = options;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    if (!location) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getReportsWithinRadius(
        location.latitude,
        location.longitude,
        radiusMiles
      );
      setReports(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch reports";
      setError(message);
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  }, [location, radiusMiles]);

  // Refresh function for manual refresh
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchReports();
  }, [fetchReports]);

  // Add interaction (confirm, mark inactive, mark false)
  const addInteraction = useCallback(
    async (reportId: string, type: InteractionType) => {
      try {
        await addReportInteraction(reportId, type);
        // Refresh reports to get updated confidence scores
        await fetchReports();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add interaction";
        throw new Error(message);
      }
    },
    [fetchReports]
  );

  // Initial fetch when location becomes available
  useEffect(() => {
    if (location) {
      fetchReports();
    }
  }, [location, fetchReports]);

  // Set up real-time subscription
  useEffect(() => {
    if (!location) return;

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to changes
    unsubscribeRef.current = subscribeToReports(
      // On insert
      (newReport) => {
        setReports((prev) => {
          // Check if report already exists
          if (prev.some((r) => r.id === newReport.id)) {
            return prev;
          }
          // Add to beginning of list
          return [newReport, ...prev];
        });
      },
      // On update
      (updatedReport) => {
        setReports((prev) =>
          prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
        );
      },
      // On delete
      (reportId) => {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [location]);

  // Auto-refresh interval
  useEffect(() => {
    if (!location || autoRefreshInterval <= 0) return;

    const intervalId = setInterval(fetchReports, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [location, autoRefreshInterval, fetchReports]);

  return {
    reports,
    loading,
    error,
    refresh,
    addInteraction,
  };
}
