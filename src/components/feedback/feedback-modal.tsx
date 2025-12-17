"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { submitFeedback } from "@/lib/supabase/feedback";
import {
  X,
  Bug,
  Lightbulb,
  Sparkles,
  HelpCircle,
  Loader2,
  CheckCircle,
  Send,
} from "lucide-react";

type Category = "bug" | "feature" | "improvement" | "other";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories: { id: Category; icon: typeof Bug }[] = [
  { id: "bug", icon: Bug },
  { id: "feature", icon: Lightbulb },
  { id: "improvement", icon: Sparkles },
  { id: "other", icon: HelpCircle },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const t = useTranslations();
  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCategory(null);
    setTitle("");
    setDescription("");
    setEmail("");
    setError(null);
    setIsSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        email: email.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-md bg-background border-border shadow-xl animate-fade-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-foreground-muted hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <CardContent className="pt-6">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success-muted flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-status-success" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t("feedback.success.title")}
              </h2>
              <p className="text-foreground-secondary text-sm">
                {t("feedback.success.message")}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-1 pr-8">
                {t("feedback.title")}
              </h2>
              <p className="text-sm text-foreground-secondary mb-6">
                {t("feedback.subtitle")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("feedback.category")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCategory(id)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-[var(--radius-md)] border transition-colors text-left",
                          category === id
                            ? "border-accent-primary bg-accent-primary-muted"
                            : "border-border hover:border-accent-primary hover:bg-accent-primary-muted/50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            category === id
                              ? "text-accent-primary"
                              : "text-foreground-muted"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            category === id
                              ? "text-foreground"
                              : "text-foreground-secondary"
                          )}
                        >
                          {t(`feedback.categories.${id}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("feedback.titleLabel")} <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("feedback.titlePlaceholder")}
                    maxLength={100}
                    required
                    className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("feedback.descriptionLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("feedback.descriptionPlaceholder")}
                    rows={3}
                    maxLength={1000}
                    className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("feedback.emailLabel")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("feedback.emailPlaceholder")}
                    className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-foreground-muted">
                    {t("feedback.emailNote")}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-[var(--radius-md)] bg-status-danger-muted text-status-danger text-sm">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!category || !title.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("feedback.submitting")}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t("feedback.submit")}
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
