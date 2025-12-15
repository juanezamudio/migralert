"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePWA } from "@/hooks";
import {
  Download,
  Share,
  Plus,
  X,
  Smartphone,
} from "lucide-react";

const INSTALL_PROMPT_DISMISSED_KEY = "migralert-install-prompt-dismissed";

interface InstallPromptProps {
  variant?: "banner" | "modal";
  onDismiss?: () => void;
}

export function InstallPrompt({ variant = "banner", onDismiss }: InstallPromptProps) {
  const t = useTranslations("pwa");
  const { installState, isIOS, promptInstall, isStandalone } = usePWA();
  const [dismissed, setDismissed] = useState(true);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    // Only show if not dismissed and can install
    if (!wasDismissed && (installState === "installable" || installState === "ios")) {
      setDismissed(false);
    }
  }, [installState]);

  const handleDismiss = () => {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true");
    setDismissed(true);
    onDismiss?.();
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const installed = await promptInstall();
      if (installed) {
        handleDismiss();
      }
    }
  };

  // Don't show if already installed, dismissed, or not installable
  if (isStandalone || dismissed || installState === "idle" || installState === "installed") {
    return null;
  }

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={() => setShowIOSInstructions(false)} />
        <div className="relative bg-surface border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] w-full max-w-sm p-6">
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="absolute top-4 right-4 p-1 text-foreground-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-accent-primary-muted flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-accent-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("ios.title")}
            </h3>
          </div>

          <ol className="space-y-4 mb-6">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent-primary text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{t("ios.step1")}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover rounded-[var(--radius-md)]">
                  <Share className="w-4 h-4 text-status-info" />
                  <span className="text-sm text-foreground-secondary">{t("ios.shareButton")}</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent-primary text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{t("ios.step2")}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover rounded-[var(--radius-md)]">
                  <Plus className="w-4 h-4 text-foreground-secondary" />
                  <span className="text-sm text-foreground-secondary">{t("ios.addButton")}</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent-primary text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                3
              </div>
              <p className="text-sm text-foreground">{t("ios.step3")}</p>
            </li>
          </ol>

          <Button onClick={() => setShowIOSInstructions(false)} className="w-full">
            {t("ios.gotIt")}
          </Button>
        </div>
      </div>
    );
  }

  // Banner variant
  if (variant === "banner") {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto animate-slide-up">
        <Card className="border-accent-primary/30 bg-surface shadow-[var(--shadow-lg)]">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-accent-primary-muted flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-accent-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground mb-0.5">
                  {t("banner.title")}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {t("banner.description")}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-foreground-muted hover:text-foreground flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDismiss}
                className="flex-1"
              >
                {t("banner.later")}
              </Button>
              <Button size="sm" onClick={handleInstall} className="flex-1">
                {isIOS ? t("banner.howTo") : t("banner.install")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modal variant (for onboarding)
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-accent-primary-muted flex items-center justify-center">
          <Download className="w-5 h-5 text-accent-primary" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">{t("banner.title")}</h3>
          <p className="text-sm text-foreground-secondary">{t("banner.description")}</p>
        </div>
      </div>
      <Button onClick={handleInstall} className="w-full">
        {isIOS ? t("banner.howTo") : t("banner.install")}
      </Button>
    </div>
  );
}
