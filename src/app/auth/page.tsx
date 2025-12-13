"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, Users, Bell, Loader2, CheckCircle, Mail, Phone, AtSign } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import { formatPhoneInput, toE164, isValidUSPhone } from "@/lib/utils/phone";

export default function AuthPage() {
  const t = useTranslations();
  const router = useRouter();
  const { signIn, signUp, resetPassword, signInWithPhone, verifyPhoneOtp } = useAuth();

  const [mode, setMode] = useState<"welcome" | "login" | "signup" | "forgot" | "check-email" | "signup-success" | "verify-otp">("welcome");
  const [previousMode, setPreviousMode] = useState<"login" | "signup">("signup");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Success - redirect to home
    router.push("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);

    const result = await signUp(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (result.needsConfirmation) {
      setMode("signup-success");
    } else {
      // Auto-confirmed, show success toast then redirect
      setShowSuccessToast(true);
      setSuccessMessage(t("auth.accountCreated"));
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await resetPassword(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setMode("check-email");
  };

  const handlePhoneSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    if (!isValidUSPhone(phone)) {
      setError(t("auth.invalidPhone"));
      return;
    }

    setLoading(true);

    // Convert to E.164 format for Supabase
    const e164Phone = toE164(phone);
    const result = await signInWithPhone(e164Phone);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setPreviousMode(mode as "login" | "signup");
    setMode("verify-otp");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Use E.164 format for verification
    const e164Phone = toE164(phone);
    const result = await verifyPhoneOtp(e164Phone, otp);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Success - show toast and redirect
    setShowSuccessToast(true);
    setSuccessMessage(t("auth.loginSuccess"));
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  // Welcome screen
  if (mode === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {showSuccessToast && (
          <Toast
            message={successMessage}
            type="success"
            duration={1500}
          />
        )}
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
            <h1 className="text-3xl font-bold font-display text-accent-primary mb-2">
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

  // Signup success screen
  if (mode === "signup-success") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success-muted flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-status-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("auth.checkEmail")}
          </h2>
          <p className="text-foreground-secondary text-sm mb-6">
            {t("auth.confirmationSent", { email })}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setMode("login");
              setPassword("");
              setConfirmPassword("");
            }}
          >
            {t("auth.backToLogin")}
          </Button>
        </div>
      </div>
    );
  }

  // Check email screen (for password reset)
  if (mode === "check-email") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-info-muted flex items-center justify-center">
            <Mail className="w-8 h-8 text-status-info" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("auth.checkEmail")}
          </h2>
          <p className="text-foreground-secondary text-sm mb-6">
            {t("auth.resetEmailSent", { email })}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setMode("login");
              setEmail("");
            }}
          >
            {t("auth.backToLogin")}
          </Button>
        </div>
      </div>
    );
  }

  // OTP verification screen
  if (mode === "verify-otp") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {showSuccessToast && (
          <Toast
            message={successMessage}
            type="success"
            duration={1500}
          />
        )}
        <header className="p-4">
          <button
            onClick={() => {
              setMode(previousMode);
              setError(null);
              setOtp("");
            }}
            className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{t("common.back")}</span>
          </button>
        </header>

        <main className="flex-1 flex flex-col px-4 max-w-lg mx-auto w-full">
          <div className="py-8">
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">
              {t("auth.verifyPhone")}
            </h1>
            <p className="text-foreground-secondary">
              {t("auth.otpSent", { phone })}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-status-danger-muted text-status-danger text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <Input
              label={t("auth.verificationCode")}
              type="text"
              inputMode="numeric"
              placeholder="123456"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
            />

            <Button className="w-full" size="lg" type="submit" disabled={loading || otp.length < 6}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("auth.verify")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                setError(null);
                setLoading(true);
                const e164Phone = toE164(phone);
                const result = await signInWithPhone(e164Phone);
                setLoading(false);
                if (result.error) {
                  setError(result.error);
                }
              }}
              className="text-sm text-accent-primary hover:underline"
              disabled={loading}
            >
              {t("auth.resendCode")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Login / Signup / Forgot password forms
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showSuccessToast && (
        <Toast
          message={successMessage}
          type="success"
          duration={1500}
        />
      )}
      {/* Header */}
      <header className="p-4">
        <button
          onClick={() => {
            setMode("welcome");
            setError(null);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
          }}
          className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">{t("common.back")}</span>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col px-4 max-w-lg mx-auto w-full">
        <div className="py-8">
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">
            {mode === "login"
              ? t("common.login")
              : mode === "forgot"
              ? t("auth.resetPassword")
              : t("auth.createAccount")}
          </h1>
          <p className="text-foreground-secondary">
            {mode === "login"
              ? t("auth.loginSubtitle")
              : mode === "forgot"
              ? t("auth.resetSubtitle")
              : t("auth.createAccountNote")}
          </p>
        </div>

        {/* Auth method toggle (for signup and login) */}
        {(mode === "signup" || mode === "login") && (
          <div className="flex gap-2 mb-6 p-1 bg-surface-hover rounded-[var(--radius-lg)]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email");
                setError(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-all",
                authMethod === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground-secondary hover:text-foreground"
              )}
            >
              <AtSign className="w-4 h-4" />
              {t("auth.email")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setError(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-all",
                authMethod === "phone"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground-secondary hover:text-foreground"
              )}
            >
              <Phone className="w-4 h-4" />
              {t("auth.phone")}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-status-danger-muted text-status-danger text-sm">
            {error}
          </div>
        )}

        <form
          className="space-y-4"
          onSubmit={
            mode === "forgot"
              ? handleForgotPassword
              : authMethod === "phone"
              ? handlePhoneSignUp // Phone auth uses same OTP flow for login and signup
              : mode === "login"
              ? handleSignIn
              : handleSignUp
          }
        >
          {/* Email input (for email auth or forgot password) */}
          {(authMethod === "email" || mode === "forgot") && (
            <Input
              label={t("auth.email")}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          {/* Phone input (for phone login/signup) */}
          {authMethod === "phone" && mode !== "forgot" && (
            <Input
              label={t("auth.phone")}
              type="tel"
              placeholder="(555) 123-4567"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              required
            />
          )}

          {/* Password fields (only for email auth, not phone) */}
          {mode !== "forgot" && authMethod === "email" && (
            <Input
              label={t("auth.password")}
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          )}

          {mode === "signup" && authMethod === "email" && (
            <Input
              label={t("auth.confirmPassword")}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          )}

          {mode === "login" && authMethod === "email" && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setPassword("");
              }}
              className="text-sm text-accent-primary hover:underline"
            >
              {t("auth.forgotPassword")}
            </button>
          )}

          <Button className="w-full" size="lg" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("common.loading")}
              </>
            ) : mode === "forgot" ? (
              t("auth.sendResetLink")
            ) : authMethod === "phone" ? (
              t("auth.sendCode")
            ) : mode === "login" ? (
              t("common.login")
            ) : (
              t("auth.createAccount")
            )}
          </Button>
        </form>

        {mode !== "forgot" && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-sm text-foreground-secondary"
            >
              {mode === "login" ? t("auth.noAccount") : t("auth.alreadyHaveAccount")}{" "}
              <span className="text-accent-primary hover:underline">
                {mode === "login" ? t("common.signup") : t("common.login")}
              </span>
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className="text-sm text-foreground-secondary"
            >
              <span className="text-accent-primary hover:underline">
                {t("auth.backToLogin")}
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
