"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  LogOut,
  User,
  Loader2,
  Phone,
  Check,
  CheckCircle,
  X,
  Sun,
  Moon,
  MessageSquarePlus,
  Heart,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useAuth, useTheme } from "@/hooks";
import { useState } from "react";
import { formatPhoneInput, formatPhoneDisplay, toE164, isValidUSPhone } from "@/lib/utils/phone";
import { signInWithPhone, verifyPhoneOtp, removePhone } from "@/lib/supabase/auth";
import { FeedbackModal } from "@/components/feedback/feedback-modal";

export default function ProfilePage() {
  const t = useTranslations();
  const { user, loading: authLoading, signOut, refreshUser } = useAuth();
  const { theme, setTheme, mounted: themeMounted } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  // Phone verification state
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "verify">("input");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  const handleSendPhoneCode = async () => {
    if (!isValidUSPhone(phoneNumber)) {
      setPhoneError(t("auth.invalidPhone"));
      return;
    }

    setPhoneLoading(true);
    setPhoneError(null);

    const result = await signInWithPhone(toE164(phoneNumber));

    setPhoneLoading(false);

    if (result.error) {
      setPhoneError(result.error.message);
    } else {
      setPhoneStep("verify");
    }
  };

  const handleVerifyPhone = async () => {
    if (otpCode.length !== 6) {
      setPhoneError(t("auth.invalidCode"));
      return;
    }

    setPhoneLoading(true);
    setPhoneError(null);

    const result = await verifyPhoneOtp(toE164(phoneNumber), otpCode);

    setPhoneLoading(false);

    if (result.error) {
      setPhoneError(result.error.message);
    } else {
      setPhoneSuccess(true);
      setShowPhoneForm(false);
      setPhoneStep("input");
      setPhoneNumber("");
      setOtpCode("");
      // Refresh user to get updated phone
      refreshUser();
      setTimeout(() => setPhoneSuccess(false), 3000);
    }
  };

  const resetPhoneForm = () => {
    setShowPhoneForm(false);
    setPhoneStep("input");
    setPhoneNumber("");
    setOtpCode("");
    setPhoneError(null);
  };

  const handleRemovePhone = async () => {
    setRemoveLoading(true);
    const result = await removePhone();
    setRemoveLoading(false);

    if (result.error) {
      setPhoneError(result.error.message);
    } else {
      setShowDeleteModal(false);
      setDeleteMode(false);
      refreshUser();
    }
  };

  const handleBadgeClick = () => {
    if (deleteMode) {
      setShowDeleteModal(true);
    } else {
      setDeleteMode(true);
    }
  };

  const settingsGroups = [
    {
      title: t("settings.preferences.title"),
      items: [
        {
          icon: Globe,
          label: t("settings.language.title"),
          description: t("settings.language.description"),
          action: "language",
        },
        {
          icon: theme === "dark" ? Moon : Sun,
          label: t("settings.theme.title"),
          description: t("settings.theme.description"),
          action: "theme",
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
          description: t("legal.findLocal.description"),
          action: "link",
          href: "/legal",
        },
        {
          icon: FileText,
          label: t("settings.about.rights"),
          description: t("rights.remember.description"),
          action: "link",
          href: "/rights",
        },
        {
          icon: MessageSquarePlus,
          label: t("feedback.title"),
          description: t("feedback.subtitle"),
          action: "feedback",
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
        {/* User Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            {authLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-6 h-6 text-foreground-muted animate-spin" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-primary-muted flex items-center justify-center">
                  <User className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {user.email}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {t("profile.signedIn")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-1.5" />
                      {t("common.logout")}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                  <LogIn className="w-6 h-6 text-foreground-muted" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{t("profile.guestUser")}</h3>
                  <p className="text-sm text-foreground-secondary">
                    {t("profile.signInPrompt")}
                  </p>
                </div>
                <Link href="/auth">
                  <Button size="sm" variant="secondary">
                    {t("common.login")}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phone Number Section - Only show for logged-in users */}
        {user && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              {/* Header row */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center">
                  <Phone className="w-5 h-5 text-foreground-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{t("auth.phone")}</h3>
                  <p className="text-sm text-foreground-secondary">
                    {user.phone ? t("alerts.phone.verified") : t("alerts.phone.notRegistered")}
                  </p>
                </div>

                {/* Right side: badge or add button */}
                {user.phone ? (
                  <button
                    onClick={handleBadgeClick}
                    className={`relative z-50 inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                      deleteMode
                        ? "bg-status-danger/10 border border-status-danger/20"
                        : "bg-status-info/10 border border-status-info/20"
                    }`}
                  >
                    <span className={`text-sm font-medium ${deleteMode ? "text-status-danger" : "text-status-info"}`}>
                      {formatPhoneDisplay(user.phone)}
                    </span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      deleteMode ? "bg-[var(--status-danger)]" : "bg-[var(--status-info)]"
                    }`}>
                      {deleteMode ? (
                        <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      ) : (
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </button>
                ) : !showPhoneForm ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPhoneForm(true)}
                  >
                    {t("alerts.phone.addPhone")}
                  </Button>
                ) : null}
              </div>

              {/* Phone form - shown below header when adding */}
              {!user.phone && showPhoneForm && (
                <div className="mt-4 space-y-3">
                  {phoneStep === "input" ? (
                    <>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">
                          +1
                        </span>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                          className="pl-10"
                          maxLength={14}
                        />
                      </div>
                      {phoneError && (
                        <p className="text-sm text-status-danger">{phoneError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={resetPhoneForm}
                          className="flex-1"
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSendPhoneCode}
                          disabled={phoneLoading || !phoneNumber}
                          className="flex-1"
                        >
                          {phoneLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t("auth.sendCode")
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-foreground-secondary">
                        {t("auth.otpSent", { phone: formatPhoneDisplay(toE164(phoneNumber)) })}
                      </p>
                      <Input
                        type="text"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                      {phoneError && (
                        <p className="text-sm text-status-danger">{phoneError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setPhoneStep("input");
                            setOtpCode("");
                            setPhoneError(null);
                          }}
                          className="flex-1"
                        >
                          {t("common.back")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleVerifyPhone}
                          disabled={phoneLoading || otpCode.length !== 6}
                          className="flex-1"
                        >
                          {phoneLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t("auth.verify")
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Success message */}
              {phoneSuccess && (
                <div className="mt-3 flex items-center gap-2 text-status-success text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("auth.loginSuccess")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <h2 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h2>
            <Card>
              <CardContent className="p-0">
                {group.items.map((item, itemIndex) => {
                  // Use div for items with nested interactive elements, Link for hrefs, button otherwise
                  const isInteractive = item.action === "language" || item.action === "toggle" || item.action === "theme";
                  const hasHref = "href" in item && item.href;
                  const isFeedback = item.action === "feedback";

                  const className = `w-full flex items-center gap-3 p-4 transition-colors text-left border-b border-border last:border-0 ${
                    isInteractive ? "" : "hover:bg-surface-hover cursor-pointer"
                  }`;

                  const content = (
                    <>
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
                      {item.action === "theme" && themeMounted && (
                        <div className="inline-flex rounded-full bg-surface-hover p-1">
                          <button
                            type="button"
                            onClick={() => setTheme("light")}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                              theme === "light"
                                ? "bg-accent-primary text-white"
                                : "text-foreground-muted hover:text-foreground"
                            }`}
                            aria-label={t("settings.theme.light")}
                          >
                            <Sun className="w-3.5 h-3.5" />
                            {t("settings.theme.light")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                              theme === "dark"
                                ? "bg-accent-primary text-white"
                                : "text-foreground-muted hover:text-foreground"
                            }`}
                            aria-label={t("settings.theme.dark")}
                          >
                            <Moon className="w-3.5 h-3.5" />
                            {t("settings.theme.dark")}
                          </button>
                        </div>
                      )}
                      {item.action === "toggle" && (
                        <button
                          type="button"
                          className="w-11 h-6 bg-surface-hover rounded-full relative hover:bg-surface-active transition-colors"
                          aria-label="Toggle notifications"
                        >
                          <div className="w-5 h-5 bg-foreground-muted rounded-full absolute left-0.5 top-0.5 transition-transform" />
                        </button>
                      )}
                      {(item.action === "link" || item.action === "feedback") && (
                        <ChevronRight className="w-5 h-5 text-foreground-muted" />
                      )}
                    </>
                  );

                  // Render as Link if href exists, otherwise div or button
                  if (hasHref) {
                    return (
                      <Link key={itemIndex} href={item.href as string} className={className}>
                        {content}
                      </Link>
                    );
                  }

                  if (isFeedback) {
                    return (
                      <button key={itemIndex} className={className} onClick={() => setShowFeedbackModal(true)}>
                        {content}
                      </button>
                    );
                  }

                  const Component = isInteractive ? "div" : "button";
                  return (
                    <Component key={itemIndex} className={className}>
                      {content}
                    </Component>
                  );
                })}
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

        {/* Support MigrAlert */}
        <Card className="mb-6 border-accent-primary/20 bg-gradient-to-br from-accent-primary/5 to-transparent">
          <CardContent className="pt-4">
            <div className="flex gap-3 mb-4">
              <Heart className="w-5 h-5 text-accent-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  {t("support.title")}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {t("support.description")}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="https://buymeacoffee.com/migralert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-surface hover:bg-surface-hover border border-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFDD00]/10 flex items-center justify-center">
                    <span className="text-lg">☕</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Buy Me a Coffee</p>
                    <p className="text-xs text-foreground-secondary">{t("support.oneTime")}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-foreground-muted" />
              </a>
              <a
                href="https://ko-fi.com/migralert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-surface hover:bg-surface-hover border border-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF5E5B]/10 flex items-center justify-center">
                    <span className="text-lg">💜</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Ko-fi</p>
                    <p className="text-xs text-foreground-secondary">{t("support.monthly")}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-foreground-muted" />
              </a>
              <a
                href="https://opencollective.com/migralert"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-surface hover:bg-surface-hover border border-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#7FADF2]/10 flex items-center justify-center">
                    <span className="text-lg">🌐</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Open Collective</p>
                    <p className="text-xs text-foreground-secondary">{t("support.transparent")}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-foreground-muted" />
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Invisible overlay to reset delete mode when clicking outside badge */}
      {deleteMode && !showDeleteModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDeleteMode(false)}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Delete Phone Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteMode(false);
            }}
          />
          <div className="relative bg-surface border border-border rounded-[var(--radius-lg)] p-5 w-full max-w-xs shadow-[var(--shadow-lg)]">
            <h3 className="text-base font-semibold text-foreground mb-2">
              Remove phone number?
            </h3>
            <p className="text-sm text-foreground-secondary mb-5">
              {t("settings.danger.deleteWarning")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteMode(false);
                }}
                disabled={removeLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-status-danger hover:bg-status-danger/90"
                onClick={handleRemovePhone}
                disabled={removeLoading}
              >
                {removeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("common.delete")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
