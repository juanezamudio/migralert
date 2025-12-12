"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Camera, MapPin, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const t = useTranslations();

  const activityTypes = [
    { value: "checkpoint", icon: "🚧" },
    { value: "raid", icon: "🚨" },
    { value: "patrol", icon: "🚔" },
    { value: "detention", icon: "⚠️" },
    { value: "other", icon: "📍" },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <Header
        title={t("report.title")}
        leftAction={
          <Link
            href="/"
            className="p-2 -ml-2 rounded-[var(--radius-md)] text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        }
      />

      {/* Content */}
      <main className="pt-16 px-4 max-w-lg mx-auto">
        <p className="text-foreground-secondary text-sm mb-6">
          {t("report.subtitle")}
        </p>

        {/* Activity Type Selection */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("report.activityType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {activityTypes.map(({ value, icon }) => (
                <button
                  key={value}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-border hover:border-accent-primary hover:bg-accent-primary-muted transition-colors text-left"
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-medium text-foreground">
                    {t(`report.types.${value}`)}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("report.photo")}</CardTitle>
            <CardDescription>{t("report.photoRequired")}</CardDescription>
          </CardHeader>
          <CardContent>
            <button className="w-full h-40 border-2 border-dashed border-border rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-2 hover:border-accent-primary hover:bg-accent-primary-muted/50 transition-colors">
              <Camera className="w-8 h-8 text-foreground-muted" />
              <span className="text-sm text-foreground-secondary">
                {t("report.takePhoto")}
              </span>
            </button>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t("report.location")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-surface-hover">
              <MapPin className="w-5 h-5 text-accent-primary" />
              <span className="text-sm text-foreground-secondary">
                {t("report.enableLocation")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button className="w-full" size="lg">
          {t("common.submit")}
        </Button>

        {/* Disclaimer */}
        <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-status-warning-muted flex gap-3">
          <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground-secondary">
            Reports require photo evidence and location verification. False reports may result in restricted access.
          </p>
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
