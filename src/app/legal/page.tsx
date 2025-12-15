"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  Scale,
  Building2,
  HeartHandshake,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function LegalResourcesPage() {
  const t = useTranslations();

  const hotlines = [
    {
      name: t("legal.hotlines.iceRaids.name"),
      number: "1-844-363-1423",
      description: t("legal.hotlines.iceRaids.description"),
      available: t("legal.hotlines.iceRaids.available"),
    },
    {
      name: t("legal.hotlines.nilc.name"),
      number: "1-213-639-3900",
      description: t("legal.hotlines.nilc.description"),
      available: t("legal.hotlines.nilc.available"),
    },
    {
      name: t("legal.hotlines.aclu.name"),
      number: "1-212-549-2500",
      description: t("legal.hotlines.aclu.description"),
      available: t("legal.hotlines.aclu.available"),
    },
  ];

  const organizations = [
    {
      name: "National Immigration Law Center (NILC)",
      description: t("legal.orgs.nilc"),
      url: "https://www.nilc.org",
      icon: Scale,
    },
    {
      name: "American Immigration Lawyers Association",
      description: t("legal.orgs.aila"),
      url: "https://www.aila.org/find-a-lawyer",
      icon: Building2,
    },
    {
      name: "United We Dream",
      description: t("legal.orgs.uwd"),
      url: "https://unitedwedream.org",
      icon: HeartHandshake,
    },
    {
      name: "Immigration Advocates Network",
      description: t("legal.orgs.ian"),
      url: "https://www.immigrationadvocates.org/legaldirectory",
      icon: MapPin,
    },
  ];

  const resources = [
    {
      title: t("legal.resources.familyPlan.title"),
      description: t("legal.resources.familyPlan.description"),
      url: "https://www.nilc.org/get-involved/community-education-resources/family-preparedness-plan/",
    },
    {
      title: t("legal.resources.detentionGuide.title"),
      description: t("legal.resources.detentionGuide.description"),
      url: "https://www.aclu.org/know-your-rights/immigrants-rights",
    },
    {
      title: t("legal.resources.powerOfAttorney.title"),
      description: t("legal.resources.powerOfAttorney.description"),
      url: "https://www.ilrc.org/power-attorney",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        title={t("legal.title")}
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
        {/* Emergency Banner */}
        <Card className="mb-6 border-status-danger/30 bg-status-danger-muted">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-status-danger flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {t("legal.emergency.title")}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {t("legal.emergency.description")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Hotlines */}
        <section className="mb-6">
          <h2 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3 px-1">
            {t("legal.sections.hotlines")}
          </h2>
          <div className="space-y-3">
            {hotlines.map((hotline, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground mb-1">
                        {hotline.name}
                      </h3>
                      <p className="text-sm text-foreground-secondary mb-2">
                        {hotline.description}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {hotline.available}
                      </p>
                    </div>
                    <a
                      href={`tel:${hotline.number.replace(/-/g, "")}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary text-white font-medium text-sm hover:bg-accent-primary-hover transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {t("legal.call")}
                    </a>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-lg font-mono font-semibold text-accent-primary">
                      {hotline.number}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Legal Organizations */}
        <section className="mb-6">
          <h2 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3 px-1">
            {t("legal.sections.organizations")}
          </h2>
          <Card>
            <CardContent className="p-0">
              {organizations.map((org, index) => (
                <a
                  key={index}
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-accent-primary-muted flex items-center justify-center flex-shrink-0">
                    <org.icon className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground mb-0.5">
                      {org.name}
                    </h3>
                    <p className="text-sm text-foreground-secondary line-clamp-2">
                      {org.description}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                </a>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Additional Resources */}
        <section className="mb-6">
          <h2 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-3 px-1">
            {t("legal.sections.resources")}
          </h2>
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="hover:bg-surface-hover transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground mb-1">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-foreground-secondary">
                          {resource.description}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-foreground-muted flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </section>

        {/* Find Local Help */}
        <section className="mb-6">
          <Card className="border-accent-primary/30 bg-accent-primary-muted">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {t("legal.findLocal.title")}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    {t("legal.findLocal.description")}
                  </p>
                  <a
                    href="https://www.immigrationadvocates.org/legaldirectory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline"
                  >
                    {t("legal.findLocal.button")}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-foreground-muted text-center px-4">
          {t("legal.disclaimer")}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
