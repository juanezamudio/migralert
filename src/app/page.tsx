"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MapView } from "@/components/map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceIndicator } from "@/components/ui/confidence-indicator";
import { Button } from "@/components/ui/button";
import { OnboardingModal } from "@/components/onboarding";
import { InstallPrompt } from "@/components/pwa";
import { useGeolocation, useReports } from "@/hooks";
import type { InteractionType } from "@/lib/supabase";
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import Image from "next/image";
import type { Report } from "@/types";

const ONBOARDING_COMPLETE_KEY = "migralert-onboarding-complete";

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if onboarding is complete on mount
  useEffect(() => {
    setMounted(true);
    const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (completed !== "true") {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const t = useTranslations();
  const { location, loading: locationLoading, refresh: refreshLocation } = useGeolocation();

  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    refresh: refreshReports,
    addInteraction,
  } = useReports({ location, radiusMiles: 25 });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [interactionLoading, setInteractionLoading] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  const handleRefresh = async () => {
    refreshLocation();
    await refreshReports();
  };

  const handleInteraction = async (reportId: string, type: InteractionType) => {
    setInteractionLoading(type);
    setInteractionError(null);

    try {
      await addInteraction(reportId, type);
      // Close the sheet after successful interaction
      setSelectedReport(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit feedback";
      setInteractionError(message);
    } finally {
      setInteractionLoading(null);
    }
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
    surveillance: t("report.types.surveillance"),
    other: t("report.types.other"),
  };

  const activityTypeIcons: Record<string, string> = {
    checkpoint: "🚧",
    raid: "🚨",
    patrol: "🚔",
    detention: "⚠️",
    surveillance: "👁️",
    other: "📍",
  };

  // Only show loading for reports, not location - map works without user location
  const isLoading = reportsLoading && !reports.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Modal */}
      {mounted && showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* Install Prompt Banner - show after onboarding */}
      {mounted && !showOnboarding && <InstallPrompt variant="banner" />}

      {/* Header */}
      <Header transparent />

      {/* Map */}
      <div className="fixed inset-0">
        <MapView
          center={location || undefined}
          zoom={13}
          reports={reports}
          onReportClick={setSelectedReport}
          onRefresh={handleRefresh}
          onLocate={refreshLocation}
        />
      </div>

      {/* Status badge - bottom center above nav */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20">
        {isLoading ? (
          <Badge variant="default" className="flex items-center gap-2 px-4 py-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("common.loading")}
          </Badge>
        ) : reportsError ? (
          <Badge variant="danger" className="px-4 py-2 text-sm">{reportsError}</Badge>
        ) : (
          <Badge
            variant={reports.length > 0 ? "warning" : "default"}
            className="flex items-center gap-2.5 px-4 py-2 text-sm shadow-lg"
          >
            {reports.length > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-warning opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-warning"></span>
              </span>
            )}
            {t("map.reportsNearby", { count: reports.length })}
          </Badge>
        )}
      </div>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setSelectedReport(null);
              setInteractionError(null);
            }}
          />
          <Card className="relative w-full max-w-md max-h-[85vh] overflow-y-auto shadow-lg animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-surface z-10">
              <h2 className="text-lg font-semibold text-foreground">
                {activityTypeIcons[selectedReport.activityType]} {activityTypeLabels[selectedReport.activityType]}
              </h2>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setInteractionError(null);
                }}
                className="p-1.5 rounded-[var(--radius-md)] text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Photo */}
                {selectedReport.imageUrl && (
                  <div className="relative w-full h-48 md:h-56 rounded-[var(--radius-md)] overflow-hidden bg-surface">
                    <Image
                      src={selectedReport.imageUrl}
                      alt="Report evidence"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

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

                {/* Error message */}
                {interactionError && (
                  <div className="p-3 rounded-[var(--radius-md)] bg-status-danger-muted text-status-danger text-sm">
                    {interactionError}
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-col h-auto py-3"
                    disabled={interactionLoading !== null}
                    onClick={() => handleInteraction(selectedReport.id, "confirm")}
                  >
                    {interactionLoading === "confirm" ? (
                      <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mb-1 text-status-success" />
                    )}
                    <span className="text-xs">{t("reportCard.confirmReport")}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-col h-auto py-3"
                    disabled={interactionLoading !== null}
                    onClick={() => handleInteraction(selectedReport.id, "no_longer_active")}
                  >
                    {interactionLoading === "no_longer_active" ? (
                      <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mb-1 text-status-warning" />
                    )}
                    <span className="text-xs">{t("reportCard.markInactive")}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-col h-auto py-3"
                    disabled={interactionLoading !== null}
                    onClick={() => handleInteraction(selectedReport.id, "false")}
                  >
                    {interactionLoading === "false" ? (
                      <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5 mb-1 text-status-danger" />
                    )}
                    <span className="text-xs">{t("reportCard.markFalse")}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
