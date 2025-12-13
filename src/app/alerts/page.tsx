"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Plus,
  User,
  Phone,
  MapPin,
  Lock,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Clock,
  Info,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth, useEmergencyContacts, useGeolocation } from "@/hooks";
import { formatPhoneInput, formatPhoneDisplay, toE164, isValidUSPhone } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";
import { Toast } from "@/components/ui/toast";

// Helper function to format time ago
function getTimeAgo(date: Date, t: ReturnType<typeof useTranslations>): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return t("reportCard.justNow");
  } else if (diffMins < 60) {
    return t("reportCard.minutesAgo", { minutes: diffMins });
  } else if (diffHours < 24) {
    return t("reportCard.hoursAgo", { hours: diffHours });
  } else {
    return t("alerts.history.daysAgo", { days: diffDays });
  }
}

export default function AlertsPage() {
  const t = useTranslations();
  const { user, loading: authLoading } = useAuth();
  const {
    contacts,
    alertConfig,
    alertHistory,
    loading: contactsLoading,
    addContact,
    updateContact,
    removeContact,
    updateAlertConfig,
    refreshHistory,
    clearHistory,
  } = useEmergencyContacts();
  const { location } = useGeolocation();

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Alert config state
  const [message, setMessage] = useState("");
  const [shareLocation, setShareLocation] = useState(true);
  const [configChanged, setConfigChanged] = useState(false);

  // Panic button state
  const [isPressing, setIsPressing] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [alertSending, setAlertSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Check if user has seen onboarding and load audio preference
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("alerts-onboarding-dismissed");
    if (!hasSeenOnboarding && user) {
      setShowOnboarding(true);
    }
    const audioPreference = localStorage.getItem("alerts-audio-enabled");
    setAudioEnabled(audioPreference === "true");
  }, [user]);

  const toggleAudio = () => {
    const newValue = !audioEnabled;
    setAudioEnabled(newValue);
    localStorage.setItem("alerts-audio-enabled", String(newValue));
    // Play a test beep when enabling
    if (newValue) {
      playAlertSound();
    }
  };

  // Play alert sound using Web Audio API
  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // A5 note
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Audio not supported
    }
  };

  const dismissOnboarding = () => {
    localStorage.setItem("alerts-onboarding-dismissed", "true");
    setShowOnboarding(false);
  };
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize alert config from data
  useEffect(() => {
    if (alertConfig) {
      setMessage(alertConfig.message);
      setShareLocation(alertConfig.share_location);
    }
  }, [alertConfig]);

  const loading = authLoading || contactsLoading;

  const resetForm = () => {
    setName("");
    setPhone("");
    setRelationship("");
    setFormError(null);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAddContact = async () => {
    if (!name.trim()) {
      setFormError(t("alerts.contacts.nameRequired"));
      return;
    }
    if (!isValidUSPhone(phone)) {
      setFormError(t("auth.invalidPhone"));
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const result = await addContact({
      name: name.trim(),
      phone: toE164(phone),
      relationship: relationship.trim() || undefined,
    });

    setFormLoading(false);

    if (result.error) {
      setFormError(result.error);
    } else {
      resetForm();
    }
  };

  const handleUpdateContact = async (id: string) => {
    if (!name.trim()) {
      setFormError(t("alerts.contacts.nameRequired"));
      return;
    }
    if (!isValidUSPhone(phone)) {
      setFormError(t("auth.invalidPhone"));
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const result = await updateContact(id, {
      name: name.trim(),
      phone: toE164(phone),
      relationship: relationship.trim() || undefined,
    });

    setFormLoading(false);

    if (result.error) {
      setFormError(result.error);
    } else {
      resetForm();
    }
  };

  const handleDeleteContact = async (id: string) => {
    await removeContact(id);
  };

  const startEditing = (contact: typeof contacts[0]) => {
    setEditingId(contact.id);
    setName(contact.name);
    // Format phone for display
    const digits = contact.phone.replace(/\D/g, "");
    const nationalNumber = digits.startsWith("1") ? digits.slice(1) : digits;
    setPhone(formatPhoneInput(nationalNumber));
    setRelationship(contact.relationship || "");
    setFormError(null);
  };

  const handleSaveConfig = async () => {
    const result = await updateAlertConfig({ message, share_location: shareLocation });
    if (!result.error) {
      setConfigChanged(false);
    }
  };

  // Panic button handlers
  const HOLD_DURATION = 3000; // 3 seconds

  const startHold = useCallback(() => {
    if (contacts.length === 0 || alertSending) return;

    setIsPressing(true);
    setHoldProgress(0);

    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      // Haptic feedback when hold completes
      vibrate(50);
      triggerAlert();
    }, HOLD_DURATION);
  }, [contacts.length, alertSending]);

  const endHold = useCallback(() => {
    setIsPressing(false);
    setHoldProgress(0);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Haptic feedback helper
  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const triggerAlert = async () => {
    endHold();
    setAlertSending(true);
    setAlertError(null);

    try {
      const response = await fetch("/api/emergency-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          shareLocation,
          latitude: shareLocation ? location?.latitude : undefined,
          longitude: shareLocation ? location?.longitude : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send alert");
      }

      // Success feedback
      vibrate([100, 50, 100]);
      if (audioEnabled) playAlertSound();

      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 5000);

      // Refresh history to show the new alert
      refreshHistory();
    } catch (error) {
      // Error feedback
      vibrate(300);
      setAlertError(error instanceof Error ? error.message : "Failed to send alert");
    } finally {
      setAlertSending(false);
    }
  };

  const sendTestAlert = async () => {
    setAlertSending(true);
    setAlertError(null);

    try {
      const response = await fetch("/api/test-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test");
      }

      // Success feedback
      vibrate([100, 50, 100]);
      if (audioEnabled) playAlertSound();

      setTestSent(true);
      setTimeout(() => setTestSent(false), 5000);

      // Refresh history
      refreshHistory();
    } catch (error) {
      vibrate(300);
      setAlertError(error instanceof Error ? error.message : "Failed to send test");
    } finally {
      setAlertSending(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Not logged in view
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background pb-20">
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

        <main className="pt-16 px-4 max-w-lg mx-auto">
          <p className="text-foreground-secondary text-sm mb-6">
            {t("alerts.subtitle")}
          </p>

          <Card className="mb-6 border-accent-primary">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-primary-muted flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">
                    {t("alerts.accountRequired")}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    {t("alerts.accountRequiredDescription")}
                  </p>
                  <Link href="/auth">
                    <Button size="sm">{t("auth.createAccount")}</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview sections (disabled) */}
          <Card className="mb-4 opacity-50 pointer-events-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("alerts.contacts.title")}
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="text-center mb-4 opacity-50">
            <div className="w-32 h-32 rounded-full bg-status-danger/20 border-4 border-status-danger/50 flex items-center justify-center mx-auto">
              <span className="text-status-danger text-2xl font-bold">SOS</span>
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {alertSent && (
        <Toast message={t("alerts.panicButton.sent")} type="success" duration={5000} />
      )}
      {testSent && (
        <Toast message={t("alerts.test.sent")} type="success" duration={5000} />
      )}
      {alertError && (
        <Toast message={alertError} type="error" duration={5000} onClose={() => setAlertError(null)} />
      )}

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

      <main className="pt-16 px-4 max-w-lg mx-auto">
        {/* Panic Button - At top */}
        <div className="mb-6">
          <button
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            disabled={contacts.length === 0 || alertSending}
            className={cn(
              "w-full py-8 rounded-[var(--radius-lg)] relative overflow-hidden transition-all",
              contacts.length === 0 || alertSending
                ? "opacity-50 cursor-not-allowed bg-status-danger/10 border-2 border-status-danger/30"
                : "bg-status-danger/10 border-2 border-status-danger hover:bg-status-danger/20 active:scale-[0.98]"
            )}
          >
            {/* Progress fill */}
            {isPressing && (
              <div
                className="absolute inset-0 bg-status-danger/30 transition-none"
                style={{ width: `${holdProgress}%` }}
              />
            )}

            <div className="relative z-10 flex flex-col items-center justify-center">
              {alertSending ? (
                <Loader2 className="w-8 h-8 animate-spin text-status-danger" />
              ) : contacts.length === 0 ? (
                <>
                  <span className="text-status-danger text-4xl font-bold">SOS</span>
                  <div className="flex items-center gap-2 text-status-warning text-sm mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t("alerts.noContactsWarning")}
                  </div>
                </>
              ) : (
                <>
                  <span className="text-status-danger text-4xl font-bold">SOS</span>
                  <span className="text-status-danger/70 text-sm mt-1">
                    {t("alerts.panicButton.hold")}
                  </span>
                </>
              )}
            </div>
          </button>
        </div>

        <p className="text-foreground-secondary text-sm mb-4">
          {t("alerts.subtitle")}
        </p>

        {/* Onboarding Card */}
        {showOnboarding && (
          <Card className="mb-4 border-accent-primary/50 bg-accent-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-accent-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-2">
                    {t("alerts.onboarding.title")}
                  </h3>
                  <ul className="space-y-1.5 text-sm text-foreground-secondary">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-primary">1.</span>
                      {t("alerts.onboarding.step1")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-primary">2.</span>
                      {t("alerts.onboarding.step2")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-primary">3.</span>
                      {t("alerts.onboarding.step3")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-primary">4.</span>
                      {t("alerts.onboarding.step4")}
                    </li>
                  </ul>
                  <button
                    onClick={dismissOnboarding}
                    className="mt-3 text-sm text-accent-primary hover:underline"
                  >
                    {t("alerts.onboarding.dismiss")}
                  </button>
                </div>
                <button
                  onClick={dismissOnboarding}
                  className="p-1 text-foreground-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Share Location Toggle */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* Location toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-foreground-muted" />
                  <div>
                    <p className="font-medium text-foreground">
                      {t("alerts.shareLocation.title")}
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      {t("alerts.shareLocation.description")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShareLocation(!shareLocation);
                    setConfigChanged(true);
                  }}
                  className={cn(
                    "w-11 h-6 rounded-full relative transition-colors",
                    shareLocation ? "bg-accent-primary" : "bg-surface-hover"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                      shareLocation ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Audio toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  {audioEnabled ? (
                    <Volume2 className="w-5 h-5 text-foreground-muted" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-foreground-muted" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {t("alerts.audio.title")}
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      {t("alerts.audio.description")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleAudio}
                  className={cn(
                    "w-11 h-6 rounded-full relative transition-colors",
                    audioEnabled ? "bg-accent-primary" : "bg-surface-hover"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                      audioEnabled ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("alerts.contacts.title")}
            </CardTitle>
            <CardDescription>{t("alerts.contacts.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Contact List */}
                {contacts.length === 0 && !showAddForm && (
                  <div className="text-center py-6 text-foreground-muted text-sm">
                    {t("alerts.contacts.empty")}
                  </div>
                )}

                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-surface-hover"
                  >
                    {editingId === contact.id ? (
                      // Edit form
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder={t("alerts.contacts.name")}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                          placeholder={t("alerts.contacts.phone")}
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                        />
                        <Input
                          placeholder={t("alerts.contacts.relationship")}
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                        />
                        {formError && (
                          <p className="text-sm text-status-danger">{formError}</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateContact(contact.id)}
                            disabled={formLoading}
                          >
                            {formLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={resetForm}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display contact
                      <>
                        <div className="w-10 h-10 rounded-full bg-accent-primary-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {contact.name}
                          </p>
                          <p className="text-sm text-foreground-secondary flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </p>
                          {contact.relationship && (
                            <p className="text-xs text-foreground-muted">
                              {contact.relationship}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => startEditing(contact)}
                          className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 text-foreground-muted hover:text-status-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add Contact Form */}
                {showAddForm && (
                  <div className="p-3 rounded-[var(--radius-md)] border border-border space-y-3">
                    <Input
                      placeholder={t("alerts.contacts.name")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      placeholder={t("alerts.contacts.phone")}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    />
                    <Input
                      placeholder={t("alerts.contacts.relationship")}
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    />
                    {formError && (
                      <p className="text-sm text-status-danger">{formError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddContact}
                        disabled={formLoading}
                        className="flex-1"
                      >
                        {formLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {t("common.save")}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={resetForm}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Add Button */}
                {!showAddForm && !editingId && contacts.length < 5 && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("alerts.contacts.add")}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert Message */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {t("alerts.message.title")}
                </CardTitle>
                <CardDescription>{t("alerts.message.subtitle")}</CardDescription>
              </div>
              <div className="relative group">
                <button
                  onClick={sendTestAlert}
                  disabled={alertSending || !user?.phone}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    alertSending || !user?.phone
                      ? "bg-status-danger/40 text-white/70 cursor-not-allowed"
                      : "bg-status-danger text-white ring-2 ring-transparent hover:ring-status-danger/30 hover:ring-offset-2 active:scale-95"
                  )}
                >
                  {alertSending ? t("alerts.test.sending") : t("alerts.test.buttonShort")}
                  <Info className="w-3 h-3 opacity-60" />
                </button>
                {/* Tooltip */}
                <div className="absolute top-full right-0 mt-2 px-3 py-2 rounded-[var(--radius-md)] bg-surface border border-border shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <p className="text-xs text-foreground-secondary whitespace-nowrap">
                    {user?.phone ? t("alerts.test.tooltip") : t("alerts.test.noPhone")}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <textarea
                className="w-full p-3 rounded-[var(--radius-md)] border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary"
                rows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setConfigChanged(true);
                }}
                placeholder={t("alerts.message.customPlaceholder")}
              />
              {/* Message templates */}
              <div className="space-y-2">
                <p className="text-xs text-foreground-muted">{t("alerts.message.templates.title")}</p>
                <button
                  onClick={() => {
                    setMessage(t("alerts.message.templates.default"));
                    setConfigChanged(true);
                  }}
                  className="w-full text-left p-2 rounded-[var(--radius-md)] border border-border text-xs text-foreground-secondary hover:bg-surface-hover transition-colors"
                >
                  {t("alerts.message.templates.default")}
                </button>
                <button
                  onClick={() => {
                    setMessage(t("alerts.message.templates.family"));
                    setConfigChanged(true);
                  }}
                  className="w-full text-left p-2 rounded-[var(--radius-md)] border border-border text-xs text-foreground-secondary hover:bg-surface-hover transition-colors"
                >
                  {t("alerts.message.templates.family")}
                </button>
                <button
                  onClick={() => {
                    setMessage(t("alerts.message.templates.legal"));
                    setConfigChanged(true);
                  }}
                  className="w-full text-left p-2 rounded-[var(--radius-md)] border border-border text-xs text-foreground-secondary hover:bg-surface-hover transition-colors"
                >
                  {t("alerts.message.templates.legal")}
                </button>
              </div>
              {configChanged && (
                <Button size="sm" onClick={handleSaveConfig}>
                  {t("common.save")}
                </Button>
              )}

              {/* Phone number status */}
              <div className="pt-3 border-t border-border">
                {user?.phone ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-info/10 border border-status-info/20">
                    <span className="text-sm font-medium text-status-info">
                      {formatPhoneDisplay(user.phone)}
                    </span>
                    <div className="w-4 h-4 rounded-full bg-[var(--status-info)] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-warning/10 border border-status-warning/20">
                      <Phone className="w-3.5 h-3.5 text-status-warning" />
                      <span className="text-sm text-status-warning">
                        {t("alerts.phone.notRegistered")}
                      </span>
                    </div>
                    <Link
                      href="/profile"
                      className="text-xs text-accent-primary hover:underline font-medium"
                    >
                      {t("alerts.phone.addPhone")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t("alerts.history.title")}
              </CardTitle>
              {alertHistory.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-foreground-muted hover:text-status-danger transition-colors"
                >
                  {t("alerts.history.clear")}
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {alertHistory.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-4">
                {t("alerts.history.empty")}
              </p>
            ) : (
              <div className="space-y-3">
                {alertHistory.map((alert) => {
                  const date = new Date(alert.created_at);
                  const timeAgo = getTimeAgo(date, t);

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-[var(--radius-md)] border",
                        alert.is_test
                          ? "border-foreground-muted/30 bg-surface-hover/50"
                          : "border-status-danger/30 bg-status-danger/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {alert.is_test && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-foreground-muted/20 text-foreground-muted">
                                {t("alerts.history.test")}
                              </span>
                            )}
                            <span className="text-xs text-foreground-muted">
                              {timeAgo}
                            </span>
                          </div>
                          <p className="text-sm text-foreground-secondary line-clamp-2">
                            {alert.message}
                          </p>
                          <p className="text-xs text-foreground-muted mt-1">
                            {t("alerts.history.notified", { count: alert.contacts_notified })}
                          </p>
                        </div>
                        {alert.latitude && alert.longitude && (
                          <a
                            href={`https://maps.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-foreground-muted hover:text-accent-primary transition-colors"
                          >
                            <MapPin className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      <BottomNav />

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative bg-surface border border-border rounded-[var(--radius-lg)] p-5 w-full max-w-xs shadow-[var(--shadow-lg)]">
            <h3 className="text-base font-semibold text-foreground mb-2">
              {t("alerts.history.confirmClear")}
            </h3>
            <p className="text-sm text-foreground-secondary mb-5">
              {t("settings.danger.deleteWarning")}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setShowClearConfirm(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-status-danger hover:bg-status-danger/90"
                onClick={() => {
                  clearHistory();
                  setShowClearConfirm(false);
                }}
              >
                {t("common.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
