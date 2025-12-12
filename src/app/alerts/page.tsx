"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, User, Phone, MapPin, Lock } from "lucide-react";
import Link from "next/link";

export default function AlertsPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <Header
        title={t("alerts.title")}
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
          {t("alerts.subtitle")}
        </p>

        {/* Requires Account Notice */}
        <Card className="mb-6 border-accent-primary">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-primary-muted flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">Account Required</h3>
                <p className="text-sm text-foreground-secondary mb-3">
                  Create an account to set up emergency contacts and use the panic button feature.
                </p>
                <Link href="/auth">
                  <Button size="sm">
                    {t("auth.createAccount")}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="mb-4 opacity-60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("alerts.contacts.title")}
            </CardTitle>
            <CardDescription>{t("alerts.contacts.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-6 text-foreground-muted text-sm">
                {t("alerts.contacts.empty")}
              </div>
              <Button variant="secondary" className="w-full" disabled>
                <Plus className="w-4 h-4 mr-2" />
                {t("alerts.contacts.add")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alert Message */}
        <Card className="mb-4 opacity-60">
          <CardHeader>
            <CardTitle className="text-base">{t("alerts.message.title")}</CardTitle>
            <CardDescription>{t("alerts.message.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Message templates */}
              <div className="p-3 rounded-[var(--radius-md)] border border-border text-sm text-foreground-secondary">
                {t("alerts.message.templates.default")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Location Toggle */}
        <Card className="mb-6 opacity-60">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-foreground-muted" />
                <div>
                  <p className="font-medium text-foreground">{t("alerts.shareLocation.title")}</p>
                  <p className="text-sm text-foreground-secondary">
                    {t("alerts.shareLocation.description")}
                  </p>
                </div>
              </div>
              <div className="w-11 h-6 bg-surface-hover rounded-full relative">
                <div className="w-5 h-5 bg-foreground-muted rounded-full absolute left-0.5 top-0.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panic Button Preview */}
        <div className="text-center mb-4">
          <p className="text-sm text-foreground-secondary mb-4">
            {t("alerts.panicButton.description")}
          </p>
          <button
            disabled
            className="w-32 h-32 rounded-full bg-status-danger/20 border-4 border-status-danger/50 flex items-center justify-center mx-auto opacity-60 cursor-not-allowed"
          >
            <div className="text-center">
              <span className="block text-status-danger text-2xl font-bold">SOS</span>
              <span className="block text-status-danger/70 text-xs mt-1">
                {t("alerts.panicButton.hold")}
              </span>
            </div>
          </button>
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
