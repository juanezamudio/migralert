"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "pending";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-hover text-foreground-secondary",
    success: "bg-status-success-muted text-status-success",
    warning: "bg-status-warning-muted text-status-warning",
    danger: "bg-status-danger-muted text-status-danger",
    info: "bg-status-info-muted text-status-info",
    pending: "bg-surface-hover text-foreground-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
