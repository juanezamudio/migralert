"use client";

import { cn } from "@/lib/utils";
import { Map, Plus, Bell, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const navItems = [
  { href: "/", icon: Map, labelKey: "map" },
  { href: "/report", icon: Plus, labelKey: "report" },
  { href: "/alerts", icon: Bell, labelKey: "alerts" },
  { href: "/profile", icon: User, labelKey: "profile" },
] as const;

function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-background-secondary/95 backdrop-blur-md border-t border-border safe-area-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-[var(--radius-md)] transition-colors min-w-[64px]",
                isActive
                  ? "text-accent-primary"
                  : "text-foreground-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-transform",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-xs font-medium">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav };
