"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
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
  Loader2,
  X,
  ShieldAlert,
  FileText,
  Info,
  CheckCircle,
  Navigation,
  Lightbulb,
  Search,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const activityTypes: { value: ActivityType; icon: string }[] = [
  { value: "checkpoint", icon: "🚧" },
  { value: "raid", icon: "🚨" },
  { value: "patrol", icon: "🚔" },
  { value: "detention", icon: "⚠️" },
  { value: "surveillance", icon: "👁️" },
  { value: "other", icon: "📍" },
];

export default function ReportPage() {
  const t = useTranslations();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { location, loading: locationLoading, error: locationError, refresh: requestLocation } = useGeolocation();

  // Form state
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Location name state
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationNameLoading, setLocationNameLoading] = useState(false);

  // Custom location state (optional override)
  const [customLocation, setCustomLocation] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);

  // Address search state
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addressContainerRef.current && !addressContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for addresses using Mapbox Geocoding API
  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&country=US&types=address,poi&limit=5`
      );
      const data = await response.json();

      const suggestions = data.features?.map((feature: { id: string; text: string; place_name: string; center: [number, number] }) => ({
        id: feature.id,
        name: feature.text,
        address: feature.place_name,
        longitude: feature.center[0],
        latitude: feature.center[1],
      })) || [];

      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error("Address search failed:", error);
      setAddressSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  }, []);

  // Debounced address search
  const handleAddressChange = useCallback((value: string) => {
    setAddressQuery(value);
    setShowSuggestions(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  }, [searchAddress]);

  // Select an address suggestion
  const selectAddress = useCallback((suggestion: typeof addressSuggestions[0]) => {
    setCustomLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      name: suggestion.address,
    });
    setAddressQuery(suggestion.address);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    setSelectedSuggestionIndex(-1);
  }, []);

  // Handle keyboard navigation for address suggestions
  const handleAddressKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || addressSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < addressSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < addressSuggestions.length) {
          selectAddress(addressSuggestions[selectedSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, addressSuggestions, selectedSuggestionIndex, selectAddress]);

  // Clear custom location
  const clearCustomLocation = useCallback(() => {
    setCustomLocation(null);
    setAddressQuery("");
    setAddressSuggestions([]);
  }, []);

  // Info card dismissal state
  const [showInfoCard, setShowInfoCard] = useState(false);

  // Mobile detection for camera capture
  const [isMobile, setIsMobile] = useState(false);

  // Check if user has dismissed the info card and detect mobile
  useEffect(() => {
    const dismissed = localStorage.getItem("report-info-dismissed");
    if (!dismissed) {
      setShowInfoCard(true);
    }

    // Detect mobile device
    const checkMobile = () => {
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileWidth = window.innerWidth < 768;
      setIsMobile(hasTouchScreen && isMobileWidth);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dismissInfoCard = useCallback(() => {
    localStorage.setItem("report-info-dismissed", "true");
    setShowInfoCard(false);
  }, []);

  // Fetch location name when location is detected
  useEffect(() => {
    if (location && !locationName && !locationNameLoading) {
      setLocationNameLoading(true);
      reverseGeocode(location.latitude, location.longitude)
        .then(({ city, region }) => {
          setLocationName(`${city}, ${region}`);
        })
        .catch(() => {
          // Silently fail - we'll just not show the location name
        })
        .finally(() => {
          setLocationNameLoading(false);
        });
    }
  }, [location, locationName, locationNameLoading]);

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

  // Form validation - use custom location if set, otherwise device location
  const effectiveLocation = customLocation || (location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    name: locationName || undefined
  } : null);
  const isFormValid = selectedType && imageFile && (location || customLocation);

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid || !effectiveLocation || !imageFile) return;

    setIsSubmitting(true);
    setSubmitError(null);

    let uploadedImageUrl: string | null = null;

    try {
      // 1. Get city and region from coordinates
      const { city, region } = await reverseGeocode(
        effectiveLocation.latitude,
        effectiveLocation.longitude
      );

      // 2. Upload image to Supabase Storage
      uploadedImageUrl = await uploadReportImage(imageFile);

      // 3. Create the report in the database
      await createReport({
        latitude: effectiveLocation.latitude,
        longitude: effectiveLocation.longitude,
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
        {/* Info Card */}
        {showInfoCard && (
          <Card className="mb-4 border-[#3B82F6]/30 bg-[#3B82F6]/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-status-info" />
                </div>
                <p className="flex-1 text-sm text-foreground leading-relaxed pt-1">
                  {t("report.subtitle")}
                </p>
                <button
                  onClick={dismissInfoCard}
                  className="p-1 text-foreground-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center">
                <MapPin className="w-5 h-5 text-foreground-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{t("report.location")}</h3>
              </div>

              {/* Pill badge */}
              {locationLoading || locationNameLoading ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-hover">
                  <Loader2 className="w-4 h-4 text-foreground-muted animate-spin" />
                </div>
              ) : location && locationName ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-success/10 border border-status-success/20">
                  <span className="text-sm font-medium text-status-success">
                    {locationName}
                  </span>
                  <div className="w-4 h-4 rounded-full bg-[var(--status-success)] flex items-center justify-center">
                    <Navigation className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    // Request geolocation permission
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        () => requestLocation(),
                        () => requestLocation(),
                        { enableHighAccuracy: true }
                      );
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-warning/10 border border-status-warning/20 hover:bg-status-warning/20 transition-colors"
                >
                  <span className="text-sm font-medium text-status-warning">
                    {t("report.enableLocation")}
                  </span>
                  <div className="w-4 h-4 rounded-full bg-[var(--status-warning)] flex items-center justify-center">
                    <Navigation className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                </button>
              )}
            </div>

            {/* Address Search - Optional override */}
            <div className="mt-4 pt-4 border-t border-border" ref={addressContainerRef}>
              <label className="text-sm text-foreground-secondary mb-2 block">
                {t("report.addressOptional")}
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <input
                    type="text"
                    value={addressQuery}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleAddressKeyDown}
                    placeholder={t("report.addressPlaceholder")}
                    className="w-full rounded-[var(--radius-md)] border border-border bg-surface pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  />
                  {(addressQuery || customLocation) && (
                    <button
                      type="button"
                      onClick={clearCustomLocation}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {searchingAddress && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted animate-spin" />
                  )}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] overflow-hidden">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => selectAddress(suggestion)}
                        className={`w-full px-3 py-2.5 text-left transition-colors border-b border-border last:border-0 ${
                          index === selectedSuggestionIndex
                            ? "bg-accent-primary-muted"
                            : "hover:bg-surface-hover"
                        }`}
                      >
                        <p className="text-sm text-foreground font-medium truncate">
                          {suggestion.name}
                        </p>
                        <p className="text-xs text-foreground-secondary truncate">
                          {suggestion.address}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Type Selection */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-foreground-secondary" />
              {t("report.activityType")}
            </CardTitle>
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
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-foreground-secondary" />
              {t("report.photo")}
            </CardTitle>
            <CardDescription>{t("report.photoRequired")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
            ) : isMobile ? (
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
            ) : (
              <button
                type="button"
                onClick={handleGallerySelect}
                className="w-full h-32 border-2 border-dashed border-border rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-2 hover:border-accent-primary hover:bg-accent-primary-muted/50 transition-colors"
              >
                <Upload className="w-6 h-6 text-foreground-muted" />
                <span className="text-xs text-foreground-secondary">
                  {t("report.uploadPhoto")}
                </span>
              </button>
            )}
            {/* Disclaimer */}
            <div className="p-3 rounded-[var(--radius-md)] bg-status-warning-muted flex gap-3">
              <Info className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground-secondary">
                {t("report.disclaimer")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Description (Optional) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-foreground-secondary" />
              {t("report.description")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setDescription(e.target.value);
                }
              }}
              placeholder={t("report.descriptionPlaceholder")}
              rows={3}
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
            />
            <div className="mt-2 text-right">
              <span className={`text-xs ${description.length >= 450 ? "text-status-warning" : "text-foreground-muted"}`}>
                {description.length}/500
              </span>
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
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
