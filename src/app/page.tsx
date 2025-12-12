"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MapView } from "@/components/map";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ConfidenceIndicator } from "@/components/ui/confidence-indicator";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks";
import {
  RefreshCw,
  Navigation,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { Report } from "@/types";

// Mock data for testing - remove once connected to Supabase
const mockReports: Report[] = [
  {
    id: "1",
    location: { latitude: 34.0522, longitude: -118.2437 },
    city: "Los Angeles",
    region: "California",
    activityType: "checkpoint",
    description: "Checkpoint set up on Main St near the freeway entrance",
    imageUrl: "/placeholder.jpg",
    status: "verified",
    confidenceScore: 85,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 11.5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    location: { latitude: 34.0622, longitude: -118.2537 },
    city: "Los Angeles",
    region: "California",
    activityType: "patrol",
    description: "Patrol vehicles seen in the area",
    imageUrl: "/placeholder.jpg",
    status: "verified",
    confidenceScore: 60,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 90 mins ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 10.5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function HomePage() {
  const t = useTranslations();
  const { location, loading: locationLoading, refresh: refreshLocation } = useGeolocation();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // For demo purposes, use mock data. In production, fetch from Supabase
  const reports = mockReports;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshLocation();
    // TODO: Refetch reports from Supabase
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleCenterOnUser = () => {
    refreshLocation();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return t("reportCard.justNow");
    if (diffMins < 60) return t("reportCard.minutesAgo", { minutes: diffMins });
    return t("reportCard.hoursAgo", { hours: diffHours });
  };

  const activityTypeLabels: Record<string, string> = {
    checkpoint: t("report.types.checkpoint"),
    raid: t("report.types.raid"),
    patrol: t("report.types.patrol"),
    detention: t("report.types.detention"),
    other: t("report.types.other"),
  };

  const activityTypeIcons: Record<string, string> = {
    checkpoint: "🚧",
    raid: "🚨",
    patrol: "🚔",
    detention: "⚠️",
    other: "📍",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header rightAction={<LanguageSwitcher />} transparent />

      {/* Map */}
      <div className="fixed inset-0">
        <MapView
          center={location || undefined}
          zoom={13}
          reports={reports}
          onReportClick={setSelectedReport}
        />
      </div>

      {/* Reports count badge */}
      <div className="fixed top-16 left-4 z-20">
        <Badge variant={reports.length > 0 ? "warning" : "default"}>
          {t("map.reportsNearby", { count: reports.length })}
        </Badge>
      </div>

      {/* Center on user button */}
      <button
        onClick={handleCenterOnUser}
        disabled={locationLoading}
        className="fixed bottom-24 left-4 z-20 w-12 h-12 rounded-full bg-surface border border-border shadow-[var(--shadow-md)] flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
        aria-label={t("map.myLocation")}
      >
        <Navigation className="w-5 h-5" />
      </button>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="fixed bottom-24 right-4 z-20 w-12 h-12 rounded-full bg-surface border border-border shadow-[var(--shadow-md)] flex items-center justify-center text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
        aria-label={t("map.refreshing")}
      >
        <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
      </button>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Report Detail Bottom Sheet */}
      <BottomSheet
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={
          selectedReport
            ? `${activityTypeIcons[selectedReport.activityType]} ${activityTypeLabels[selectedReport.activityType]}`
            : ""
        }
      >
        {selectedReport && (
          <div className="space-y-4">
            {/* Status and time */}
            <div className="flex items-center justify-between">
              <Badge
                variant={selectedReport.status === "verified" ? "success" : "pending"}
              >
                {selectedReport.status === "verified"
                  ? t("reportCard.verified")
                  : t("reportCard.pending")}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                <Clock className="w-4 h-4" />
                {getTimeAgo(selectedReport.createdAt)}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-foreground-secondary">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {selectedReport.city}, {selectedReport.region}
              </span>
            </div>

            {/* Description */}
            {selectedReport.description && (
              <p className="text-foreground text-sm">
                {selectedReport.description}
              </p>
            )}

            {/* Confidence score */}
            <div>
              <p className="text-xs text-foreground-muted mb-1.5">
                Confidence Score
              </p>
              <ConfidenceIndicator
                score={selectedReport.confidenceScore}
                showLabel
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-col h-auto py-3"
              >
                <CheckCircle className="w-5 h-5 mb-1 text-status-success" />
                <span className="text-xs">{t("reportCard.confirmReport")}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-col h-auto py-3"
              >
                <AlertCircle className="w-5 h-5 mb-1 text-status-warning" />
                <span className="text-xs">{t("reportCard.markInactive")}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-col h-auto py-3"
              >
                <XCircle className="w-5 h-5 mb-1 text-status-danger" />
                <span className="text-xs">{t("reportCard.markFalse")}</span>
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
