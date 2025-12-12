"use client";

import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/types";

interface ConfidenceIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "pending";
}

function ConfidenceIndicator({
  score,
  showLabel = false,
  size = "md",
}: ConfidenceIndicatorProps) {
  const level = getConfidenceLevel(score);

  const colors = {
    high: "bg-confidence-high",
    medium: "bg-confidence-medium",
    low: "bg-confidence-low",
    pending: "bg-confidence-pending",
  };

  const labels = {
    high: "High",
    medium: "Medium",
    low: "Low",
    pending: "Pending",
  };

  const sizes = {
    sm: "h-1.5",
    md: "h-2",
  };

  // Calculate fill percentage (max score is 100)
  const fillPercentage = Math.min(100, Math.max(0, score));

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex-1 rounded-full bg-surface-hover overflow-hidden",
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence: ${labels[level]}`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", colors[level])}
          style={{ width: `${fillPercentage}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-medium",
            level === "high" && "text-confidence-high",
            level === "medium" && "text-confidence-medium",
            level === "low" && "text-confidence-low",
            level === "pending" && "text-confidence-pending"
          )}
        >
          {labels[level]}
        </span>
      )}
    </div>
  );
}

export { ConfidenceIndicator, getConfidenceLevel };
