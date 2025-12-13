"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGeolocation } from "@/hooks";
import { createReport, uploadReportImage, compressImage, deleteReportImage } from "@/lib/supabase";
import { reverseGeocode } from "@/lib/utils";
import type { ActivityType } from "@/types";
import {
  ArrowLeft,
  Camera,
  Upload,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const activityTypes: { value: ActivityType; icon: string }[] = [
  { value: "checkpoint", icon: "🚧" },
  { value: "raid", icon: "🚨" },
  { value: "patrol", icon: "🚔" },
  { value: "detention", icon: "⚠️" },
  { value: "other", icon: "📍" },
];

export default function ReportPage() {
  const t = useTranslations();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { location, loading: locationLoading, error: locationError } = useGeolocation();

  // Form state
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle image selection
  const handleImageSelect = async (file: File) => {
    try {
      // Compress image before preview
      const compressed = await compressImage(file, 1200, 0.8);
      setImageFile(compressed);

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressed);
      setImagePreview(previewUrl);
    } catch {
      setSubmitError("Failed to process image");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleCameraCapture = () => {
    // Trigger file input with camera capture
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    // Trigger file input for gallery
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Form validation
  const isFormValid = selectedType && imageFile && location;

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid || !location || !imageFile) return;

    setIsSubmitting(true);
    setSubmitError(null);

    let uploadedImageUrl: string | null = null;

    try {
      // 1. Get city and region from coordinates
      const { city, region } = await reverseGeocode(
        location.latitude,
        location.longitude
      );

      // 2. Upload image to Supabase Storage
      uploadedImageUrl = await uploadReportImage(imageFile);

      // 3. Create the report in the database
      await createReport({
        latitude: location.latitude,
        longitude: location.longitude,
        city,
        region,
        activityType: selectedType,
        description: description || undefined,
        imageUrl: uploadedImageUrl,
      });

      // Success!
      setSubmitSuccess(true);

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit report";
      setSubmitError(message);

      // Clean up uploaded image if report creation failed
      if (uploadedImageUrl) {
        try {
          await deleteReportImage(uploadedImageUrl);
        } catch {
          // Ignore cleanup errors
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-success-muted flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-status-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t("report.success")}
          </h2>
          <p className="text-foreground-secondary text-sm">
            {t("report.successMessage")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <Header
        title={t("report.title")}
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
        <p className="text-foreground-secondary text-sm mb-6">
          {t("report.subtitle")}
        </p>

        {/* Activity Type Selection */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("report.activityType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {activityTypes.map(({ value, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedType(value)}
                  className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border transition-colors text-left ${
                    selectedType === value
                      ? "border-accent-primary bg-accent-primary-muted"
                      : "border-border hover:border-accent-primary hover:bg-accent-primary-muted/50"
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-medium text-foreground">
                    {t(`report.types.${value}`)}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("report.photo")}</CardTitle>
            <CardDescription>{t("report.photoRequired")}</CardDescription>
          </CardHeader>
          <CardContent>
            {imagePreview ? (
              <div className="relative">
                <div className="relative w-full h-48 rounded-[var(--radius-md)] overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Report preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="h-32 border-2 border-dashed border-border rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-2 hover:border-accent-primary hover:bg-accent-primary-muted/50 transition-colors"
                >
                  <Camera className="w-6 h-6 text-foreground-muted" />
                  <span className="text-xs text-foreground-secondary">
                    {t("report.takePhoto")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleGallerySelect}
                  className="h-32 border-2 border-dashed border-border rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-2 hover:border-accent-primary hover:bg-accent-primary-muted/50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-foreground-muted" />
                  <span className="text-xs text-foreground-secondary">
                    {t("report.uploadPhoto")}
                  </span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description (Optional) */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{t("report.description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("report.descriptionPlaceholder")}
              rows={3}
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
            />
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t("report.location")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-surface-hover">
              {locationLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-foreground-muted animate-spin" />
                  <span className="text-sm text-foreground-secondary">
                    Detecting location...
                  </span>
                </>
              ) : locationError ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-status-danger" />
                  <span className="text-sm text-status-danger">
                    {t("report.locationFailed")}
                  </span>
                </>
              ) : location ? (
                <>
                  <MapPin className="w-5 h-5 text-status-success" />
                  <span className="text-sm text-foreground">
                    {t("report.locationDetected")}
                  </span>
                  <CheckCircle className="w-4 h-4 text-status-success ml-auto" />
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 text-foreground-muted" />
                  <span className="text-sm text-foreground-secondary">
                    {t("report.enableLocation")}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {submitError && (
          <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-status-danger-muted text-status-danger text-sm">
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={!isFormValid || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("report.submitting")}
            </>
          ) : (
            t("common.submit")
          )}
        </Button>

        {/* Disclaimer */}
        <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-status-warning-muted flex gap-3">
          <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground-secondary">
            Reports require photo evidence and location verification. False reports may result in restricted access.
          </p>
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
