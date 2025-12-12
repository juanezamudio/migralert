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
          ? "bg-transparent"
          : "bg-background-secondary/95 backdrop-blur-md border-b border-border"
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 min-w-[40px]">
          {leftAction}
        </div>

        <div className="flex-1 text-center">
          {title && (
            <h1 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-foreground-secondary truncate">
              {subtitle}
            </p>
          )}
          {!title && !subtitle && (
            <span className="text-lg font-bold text-accent-primary">
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
