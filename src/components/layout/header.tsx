"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  transparent?: boolean;
}

function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  transparent = false,
}: HeaderProps) {
  const t = useTranslations("common");

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-30 safe-area-top",
        transparent
          ? "bg-transparent pt-4"
          : "bg-background-secondary/95 backdrop-blur-md border-b border-border"
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 min-w-[40px]">
          {leftAction}
        </div>

        <div className="flex-1 text-center">
          {title && (
            <h1
              className={cn(
                "text-lg font-semibold font-display tracking-tight truncate",
                transparent
                  ? "inline-block px-4 py-1.5 rounded-full bg-[#1a1a1f]/90 backdrop-blur-md border border-[#2a2a30] text-foreground shadow-lg"
                  : "text-foreground"
              )}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-foreground-secondary truncate">
              {subtitle}
            </p>
          )}
          {!title && !subtitle && (
            <span
              className={cn(
                "text-2xl font-bold font-display tracking-tight",
                transparent
                  ? "inline-block px-6 py-2.5 rounded-full bg-[#1a1a1f]/90 backdrop-blur-md border border-[#2a2a30] text-accent-primary shadow-lg"
                  : "text-accent-primary"
              )}
            >
              {t("appName")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 min-w-[40px] justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  );
}

export { Header };
