// Report Types
export type ActivityType = "checkpoint" | "raid" | "patrol" | "detention" | "surveillance" | "other";

export type ReportStatus = "pending" | "verified" | "removed";

export type ConfidenceLevel = "high" | "medium" | "low" | "pending";

export interface Report {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city: string;
  region: string;
  activityType: ActivityType;
  description?: string;
  imageUrl: string;
  status: ReportStatus;
  confidenceScore: number;
  reporterId?: string;
  verifiedBy?: string;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
}

export interface ReportWithDistance extends Report {
  distance?: number; // in miles
}

// User Types
export type UserRole = "user" | "moderator" | "admin";

export type Language = "en" | "es";

export interface Profile {
  id: string;
  displayName?: string;
  preferredLanguage: Language;
  role: UserRole;
  moderatorRegions?: string[];
  createdAt: string;
  updatedAt: string;
}

// Emergency Contact Types
export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship?: string;
  order: number;
  createdAt: string;
}

export interface AlertConfig {
  userId: string;
  message: string;
  shareLocation: boolean;
  updatedAt: string;
}

// Interaction Types
export type InteractionType = "confirm" | "no_longer_active" | "false";

export interface ReportInteraction {
  id: string;
  reportId: string;
  userId?: string;
  interactionType: InteractionType;
  createdAt: string;
}

// Connection Types
export type ConnectionStatus = "pending" | "accepted";

export interface UserConnection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: ConnectionStatus;
  createdAt: string;
}

// UI Types
export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Form Types
export interface ReportFormData {
  activityType: ActivityType;
  description?: string;
  image: File | null;
  location: GeoLocation;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
