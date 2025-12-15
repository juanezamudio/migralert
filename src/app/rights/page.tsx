"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Shield,
  Home,
  Car,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Scenario = "street" | "home" | "checkpoint" | "workplace";

export default function KnowYourRightsPage() {
  const t = useTranslations();
  const [activeScenario, setActiveScenario] = useState<Scenario>("street");

  const scenarios: { id: Scenario; icon: typeof Home; label: string }[] = [
    { id: "street", icon: Car, label: t("rights.scenarios.street.title") },
    { id: "home", icon: Home, label: t("rights.scenarios.home.title") },
    { id: "checkpoint", icon: AlertTriangle, label: t("rights.scenarios.checkpoint.title") },
    { id: "workplace", icon: Building2, label: t("rights.scenarios.workplace.title") },
  ];

  const scenarioContent: Record<Scenario, { dos: string[]; donts: string[]; say: string }> = {
    street: {
      dos: [
        t("rights.scenarios.street.dos.0"),
        t("rights.scenarios.street.dos.1"),
        t("rights.scenarios.street.dos.2"),
        t("rights.scenarios.street.dos.3"),
      ],
      donts: [
        t("rights.scenarios.street.donts.0"),
        t("rights.scenarios.street.donts.1"),
        t("rights.scenarios.street.donts.2"),
      ],
      say: t("rights.scenarios.street.say"),
    },
    home: {
      dos: [
        t("rights.scenarios.home.dos.0"),
        t("rights.scenarios.home.dos.1"),
        t("rights.scenarios.home.dos.2"),
        t("rights.scenarios.home.dos.3"),
      ],
      donts: [
        t("rights.scenarios.home.donts.0"),
        t("rights.scenarios.home.donts.1"),
        t("rights.scenarios.home.donts.2"),
      ],
      say: t("rights.scenarios.home.say"),
    },
    checkpoint: {
      dos: [
        t("rights.scenarios.checkpoint.dos.0"),
        t("rights.scenarios.checkpoint.dos.1"),
        t("rights.scenarios.checkpoint.dos.2"),
        t("rights.scenarios.checkpoint.dos.3"),
      ],
      donts: [
        t("rights.scenarios.checkpoint.donts.0"),
        t("rights.scenarios.checkpoint.donts.1"),
        t("rights.scenarios.checkpoint.donts.2"),
      ],
      say: t("rights.scenarios.checkpoint.say"),
    },
    workplace: {
      dos: [
        t("rights.scenarios.workplace.dos.0"),
        t("rights.scenarios.workplace.dos.1"),
        t("rights.scenarios.workplace.dos.2"),
        t("rights.scenarios.workplace.dos.3"),
      ],
      donts: [
        t("rights.scenarios.workplace.donts.0"),
        t("rights.scenarios.workplace.donts.1"),
        t("rights.scenarios.workplace.donts.2"),
      ],
      say: t("rights.scenarios.workplace.say"),
    },
  };

  const coreRights = [
    t("rights.core.0"),
    t("rights.core.1"),
    t("rights.core.2"),
    t("rights.core.3"),
    t("rights.core.4"),
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        title={t("rights.title")}
        leftAction={
          <Link
            href="/profile"
            className="p-2 -ml-2 rounded-[var(--radius-md)] text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        }
      />

      <main className="pt-16 px-4 max-w-lg mx-auto">
        {/* Digital Rights Card */}
        <Card className="mb-6 border-accent-primary bg-gradient-to-br from-accent-primary/10 to-accent-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-accent-primary" />
              <h2 className="font-semibold text-foreground">
                {t("rights.card.title")}
              </h2>
            </div>
            <ul className="space-y-2">
              {coreRights.map((right, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{right}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Scenario Selector */}
        <section className="mb-4">
          <h2 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3 px-1">
            {t("rights.selectScenario")}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario.id)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-[var(--radius-md)] border transition-colors text-left",
                  activeScenario === scenario.id
                    ? "border-accent-primary bg-accent-primary-muted"
                    : "border-border hover:border-accent-primary hover:bg-accent-primary-muted/50"
                )}
              >
                <scenario.icon className={cn(
                  "w-5 h-5",
                  activeScenario === scenario.id ? "text-accent-primary" : "text-foreground-muted"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  activeScenario === scenario.id ? "text-foreground" : "text-foreground-secondary"
                )}>
                  {scenario.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Scenario Content */}
        <section className="mb-6 animate-fade-in" key={activeScenario}>
          {/* What to Say */}
          <Card className="mb-4 border-status-info/30 bg-status-info-muted">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-status-info" />
                <h3 className="font-medium text-foreground text-sm">
                  {t("rights.whatToSay")}
                </h3>
              </div>
              <p className="text-foreground font-medium text-lg leading-relaxed">
                "{scenarioContent[activeScenario].say}"
              </p>
            </CardContent>
          </Card>

          {/* Do's */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-status-success" />
                <h3 className="font-medium text-foreground text-sm">
                  {t("rights.dos")}
                </h3>
              </div>
              <ul className="space-y-2">
                {scenarioContent[activeScenario].dos.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success flex-shrink-0 mt-2" />
                    <span className="text-foreground-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Don'ts */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-status-danger" />
                <h3 className="font-medium text-foreground text-sm">
                  {t("rights.donts")}
                </h3>
              </div>
              <ul className="space-y-2">
                {scenarioContent[activeScenario].donts.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-danger flex-shrink-0 mt-2" />
                    <span className="text-foreground-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Important Reminder */}
        <Card className="mb-6 border-status-warning/30 bg-status-warning-muted">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {t("rights.remember.title")}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {t("rights.remember.description")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link to Legal Resources */}
        <Link href="/legal" className="block">
          <Card className="hover:bg-surface-hover transition-colors">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-accent-primary-muted flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {t("rights.needHelp.title")}
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      {t("rights.needHelp.description")}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-foreground-muted rotate-180" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
