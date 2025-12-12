"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Globe,
  Bell,
  Shield,
  Info,
  ChevronRight,
  Scale,
  FileText,
  LogIn,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const t = useTranslations();

  const settingsGroups = [
    {
      title: t("settings.language.title"),
      items: [
        {
          icon: Globe,
          label: t("settings.language.title"),
          description: t("settings.language.description"),
          action: "language",
        },
      ],
    },
    {
      title: t("settings.notifications.title"),
      items: [
        {
          icon: Bell,
          label: t("settings.notifications.push"),
          description: t("settings.notifications.pushDescription"),
          action: "toggle",
        },
      ],
    },
    {
      title: t("settings.about.title"),
      items: [
        {
          icon: Scale,
          label: t("settings.about.legal"),
          description: "Legal assistance resources",
          action: "link",
        },
        {
          icon: FileText,
          label: t("settings.about.rights"),
          description: "Your rights during an encounter",
          action: "link",
        },
        {
          icon: Info,
          label: t("settings.about.version"),
          description: "0.1.0 (MVP)",
          action: "none",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <Header
        title={t("settings.title")}
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
        {/* Login prompt */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                <LogIn className="w-6 h-6 text-foreground-muted" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Guest User</h3>
                <p className="text-sm text-foreground-secondary">
                  Sign in to save your preferences
                </p>
              </div>
              <Link href="/auth">
                <Button size="sm" variant="secondary">
                  {t("common.login")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <h2 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h2>
            <Card>
              <CardContent className="p-0">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    className="w-full flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors text-left border-b border-border last:border-0"
                  >
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-foreground-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-foreground-secondary truncate">
                        {item.description}
                      </p>
                    </div>
                    {item.action === "language" && <LanguageSwitcher />}
                    {item.action === "toggle" && (
                      <div className="w-11 h-6 bg-surface-hover rounded-full relative">
                        <div className="w-5 h-5 bg-foreground-muted rounded-full absolute left-0.5 top-0.5" />
                      </div>
                    )}
                    {item.action === "link" && (
                      <ChevronRight className="w-5 h-5 text-foreground-muted" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Privacy Notice */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-status-success flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  {t("settings.privacy.title")}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {t("settings.privacy.dataInfo")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
