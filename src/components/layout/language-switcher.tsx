"use client";

import { cn } from "@/lib/utils";
import { type Locale } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";

function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const t = useTranslations("accessibility");

  const handleLocaleChange = (locale: Locale) => {
    if (locale === currentLocale) return;
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <div
      className="inline-flex rounded-full bg-surface-hover p-1"
      role="radiogroup"
      aria-label={t("languageSelector")}
    >
      <button
        onClick={() => handleLocaleChange("en")}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-colors",
          currentLocale === "en"
            ? "bg-accent-primary text-white"
            : "text-foreground-muted hover:text-foreground"
        )}
        role="radio"
        aria-checked={currentLocale === "en"}
      >
        EN
      </button>
      <button
        onClick={() => handleLocaleChange("es")}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-colors",
          currentLocale === "es"
            ? "bg-accent-primary text-white"
            : "text-foreground-muted hover:text-foreground"
        )}
        role="radio"
        aria-checked={currentLocale === "es"}
      >
        ES
      </button>
    </div>
  );
}

export { LanguageSwitcher };
