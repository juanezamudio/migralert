"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { cn } from "@/lib/utils";
import {
  Shield,
  MapPin,
  Bell,
  Users,
  Navigation,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Globe,
} from "lucide-react";

const ONBOARDING_COMPLETE_KEY = "migralert-onboarding-complete";

type Step = {
  id: string;
  icon: typeof Shield;
  iconBg: string;
  iconColor: string;
};

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [locationPermission, setLocationPermission] = useState<
    "prompt" | "granted" | "denied" | "requesting"
  >("prompt");

  const steps: Step[] = [
    {
      id: "welcome",
      icon: Shield,
      iconBg: "bg-accent-primary-muted",
      iconColor: "text-accent-primary",
    },
    {
      id: "reports",
      icon: MapPin,
      iconBg: "bg-status-warning-muted",
      iconColor: "text-status-warning",
    },
    {
      id: "alerts",
      icon: Bell,
      iconBg: "bg-status-danger-muted",
      iconColor: "text-status-danger",
    },
    {
      id: "location",
      icon: Navigation,
      iconBg: "bg-status-info-muted",
      iconColor: "text-status-info",
    },
    {
      id: "account",
      icon: Users,
      iconBg: "bg-status-success-muted",
      iconColor: "text-status-success",
    },
  ];

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    onComplete();
  }, [onComplete]);

  const goToAuth = useCallback(() => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    router.push("/auth");
  }, [router]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, steps.length, completeOnboarding]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const requestLocationPermission = useCallback(async () => {
    setLocationPermission("requesting");

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });

      if (result.state === "granted") {
        setLocationPermission("granted");
        setTimeout(() => nextStep(), 1000);
      } else if (result.state === "denied") {
        setLocationPermission("denied");
      } else {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationPermission("granted");
            setTimeout(() => nextStep(), 1000);
          },
          () => {
            setLocationPermission("denied");
          },
          { enableHighAccuracy: true }
        );
      }
    } catch {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationPermission("granted");
          setTimeout(() => nextStep(), 1000);
        },
        () => {
          setLocationPermission("denied");
        },
        { enableHighAccuracy: true }
      );
    }
  }, [nextStep]);

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isLocationStep = currentStepData.id === "location";
  const isWelcomeStep = currentStepData.id === "welcome";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with skip and language */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-foreground-muted" />
            <LanguageSwitcher />
          </div>
          <button
            onClick={completeOnboarding}
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            {t("skip")}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-5",
                currentStepData.iconBg
              )}
            >
              <Icon className={cn("w-8 h-8", currentStepData.iconColor)} />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold font-display text-foreground mb-3">
              {t(`steps.${currentStepData.id}.title`)}
            </h2>

            {/* Description */}
            <p className="text-sm text-foreground-secondary mb-5 leading-relaxed">
              {t(`steps.${currentStepData.id}.description`)}
            </p>

            {/* Features list (for reports and alerts steps) */}
            {(currentStepData.id === "reports" ||
              currentStepData.id === "alerts") && (
              <ul className="space-y-2.5 mb-5 w-full text-left">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        currentStepData.iconBg
                      )}
                    >
                      <ChevronRight
                        className={cn("w-3 h-3", currentStepData.iconColor)}
                      />
                    </div>
                    <span className="text-sm text-foreground-secondary">
                      {t(`steps.${currentStepData.id}.features.${i}`)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Location permission UI */}
            {isLocationStep && (
              <div className="w-full mb-4">
                {locationPermission === "prompt" && (
                  <Button
                    onClick={requestLocationPermission}
                    className="w-full"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {t("steps.location.enableButton")}
                  </Button>
                )}
                {locationPermission === "requesting" && (
                  <Button disabled className="w-full">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("steps.location.requesting")}
                  </Button>
                )}
                {locationPermission === "granted" && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-[var(--radius-md)] bg-status-success-muted text-status-success">
                    <Navigation className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      {t("steps.location.granted")}
                    </span>
                  </div>
                )}
                {locationPermission === "denied" && (
                  <div className="text-center">
                    <div className="p-3 rounded-[var(--radius-md)] bg-status-warning-muted text-status-warning mb-2">
                      <p className="text-sm">{t("steps.location.denied")}</p>
                    </div>
                    <button
                      onClick={nextStep}
                      className="text-sm text-foreground-muted hover:text-foreground"
                    >
                      {t("steps.location.continueAnyway")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Account step buttons */}
            {isLastStep && (
              <div className="w-full space-y-2">
                <Button onClick={goToAuth} className="w-full">
                  {t("steps.account.createButton")}
                </Button>
                <Button
                  onClick={completeOnboarding}
                  variant="secondary"
                  className="w-full"
                >
                  {t("steps.account.skipButton")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer with navigation */}
        <div className="p-4 border-t border-border">
          {/* Progress indicators */}
          <div className="flex justify-center gap-1.5 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentStep
                    ? "w-6 bg-accent-primary"
                    : index < currentStep
                    ? "w-1.5 bg-accent-primary/50"
                    : "w-1.5 bg-surface-hover"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          {!isLastStep && !isLocationStep && (
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="secondary"
                  onClick={prevStep}
                  className="flex-1"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t("back")}
                </Button>
              )}
              <Button
                onClick={nextStep}
                className={currentStep === 0 ? "w-full" : "flex-1"}
                size="sm"
              >
                {t("next")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Location step navigation */}
          {isLocationStep &&
            locationPermission !== "granted" &&
            locationPermission !== "denied" && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={prevStep}
                  className="flex-1"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t("back")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={nextStep}
                  className="flex-1"
                  size="sm"
                >
                  {t("steps.location.later")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
