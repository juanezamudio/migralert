"use client";

import { cn } from "@/lib/utils";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";

function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const t = useTranslations("accessibility");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocaleChange = (locale: Locale) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-[var(--radius-md)] text-foreground-secondary hover:text-foreground hover:bg-surface-hover transition-colors"
        aria-label={t("languageSelector")}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-36 rounded-[var(--radius-md)] bg-surface border border-border shadow-[var(--shadow-lg)] overflow-hidden animate-fade-in"
          role="menu"
        >
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={cn(
                "w-full px-4 py-2.5 text-left text-sm transition-colors",
                locale === currentLocale
                  ? "bg-accent-primary-muted text-accent-primary font-medium"
                  : "text-foreground hover:bg-surface-hover"
              )}
              role="menuitem"
            >
              {localeNames[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { LanguageSwitcher };
