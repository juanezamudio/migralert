"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, Users, Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AuthPage() {
  const t = useTranslations();
  const [mode, setMode] = useState<"welcome" | "login" | "signup">("welcome");

  const features = [
    {
      icon: Users,
      title: "Emergency Contacts",
      description: "Save up to 5 contacts to alert instantly",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Get alerts for activity in your area",
    },
    {
      icon: Shield,
      title: "Connect with Family",
      description: "Link accounts for instant in-app alerts",
    },
  ];

  if (mode === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="p-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{t("common.back")}</span>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col px-4 max-w-lg mx-auto w-full">
          {/* Logo/Title */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-accent-primary mb-2">
              {t("common.appName")}
            </h1>
            <p className="text-foreground-secondary">
              {t("auth.tagline")}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-primary-muted flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                    <p className="text-sm text-foreground-secondary">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3 mt-auto pb-8">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setMode("signup")}
            >
              {t("auth.createAccount")}
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={() => setMode("login")}
            >
              {t("common.login")}
            </Button>

            <Link href="/" className="block">
              <Button variant="ghost" className="w-full" size="lg">
                {t("auth.continueAnonymous")}
              </Button>
            </Link>

            <p className="text-center text-xs text-foreground-muted">
              {t("auth.anonymousNote")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button
          onClick={() => setMode("welcome")}
          className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">{t("common.back")}</span>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col px-4 max-w-lg mx-auto w-full">
        <div className="py-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {mode === "login" ? t("common.login") : t("auth.createAccount")}
          </h1>
          <p className="text-foreground-secondary">
            {mode === "login"
              ? t("auth.noAccount")
              : t("auth.createAccountNote")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input
            label={t("auth.email")}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Input
            label={t("auth.password")}
            type="password"
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {mode === "signup" && (
            <Input
              label={t("auth.confirmPassword")}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          )}

          {mode === "login" && (
            <button
              type="button"
              className="text-sm text-accent-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </button>
          )}

          <Button className="w-full" size="lg" type="submit">
            {mode === "login" ? t("common.login") : t("auth.createAccount")}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sm text-foreground-secondary"
          >
            {mode === "login" ? t("auth.noAccount") : t("auth.alreadyHaveAccount")}{" "}
            <span className="text-accent-primary hover:underline">
              {mode === "login" ? t("common.signup") : t("common.login")}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
