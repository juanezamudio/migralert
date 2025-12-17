"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DigitInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  separator?: number; // Add separator after every N digits (e.g., 3 for phone: XXX-XXX-XXXX)
  className?: string;
}

export function DigitInput({
  length,
  value,
  onChange,
  label,
  error = false,
  disabled = false,
  autoFocus = false,
  separator,
  className,
}: DigitInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Convert value to array of digits
  const digits = value.split("").slice(0, length);
  while (digits.length < length) {
    digits.push("");
  }

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
    }
  }, [length]);

  const handleChange = useCallback(
    (index: number, inputValue: string) => {
      // Only allow digits
      const digit = inputValue.replace(/\D/g, "").slice(-1);

      if (digit) {
        const newDigits = [...digits];
        newDigits[index] = digit;
        onChange(newDigits.join(""));

        // Move to next input
        if (index < length - 1) {
          focusInput(index + 1);
        }
      }
    },
    [digits, onChange, length, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const newDigits = [...digits];

        if (digits[index]) {
          // Clear current digit
          newDigits[index] = "";
          onChange(newDigits.join(""));
        } else if (index > 0) {
          // Move to previous input and clear it
          newDigits[index - 1] = "";
          onChange(newDigits.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [digits, onChange, length, focusInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

      if (pastedData) {
        onChange(pastedData);

        // Focus the next empty input or last input
        const nextIndex = Math.min(pastedData.length, length - 1);
        focusInput(nextIndex);
      }
    },
    [onChange, length, focusInput]
  );

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
    // Select the input content
    inputRefs.current[index]?.select();
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(null);
  }, []);

  // Check if we need a separator before this index
  const needsSeparator = (index: number) => {
    if (!separator || index === 0) return false;
    return index % separator === 0;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="flex items-center justify-center gap-2">
        {digits.map((digit, index) => (
          <div key={index} className="flex items-center gap-2">
            {needsSeparator(index) && (
              <span className="text-foreground-muted text-lg font-medium">-</span>
            )}
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              disabled={disabled}
              className={cn(
                "w-11 h-14 text-center text-xl font-semibold rounded-[var(--radius-md)] border-2 bg-surface transition-all duration-200 relative",
                "focus:outline-none focus:ring-0",
                focusedIndex === index && "z-10",
                error
                  ? "border-status-danger text-status-danger"
                  : focusedIndex === index
                  ? "border-accent-primary bg-accent-primary-muted/30"
                  : digit
                  ? "border-accent-primary/50 bg-accent-primary-muted/10"
                  : "border-border hover:border-foreground-muted",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`Digit ${index + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Specialized component for phone numbers with country code display
interface PhoneDigitInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function PhoneDigitInput({
  value,
  onChange,
  label,
  error = false,
  disabled = false,
  autoFocus = false,
  className,
}: PhoneDigitInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const length = 10;

  // Convert value to array of digits
  const digits = value.split("").slice(0, length);
  while (digits.length < length) {
    digits.push("");
  }

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
    }
  }, []);

  const handleChange = useCallback(
    (index: number, inputValue: string) => {
      const digit = inputValue.replace(/\D/g, "").slice(-1);

      if (digit) {
        const newDigits = [...digits];
        newDigits[index] = digit;
        onChange(newDigits.join(""));

        if (index < length - 1) {
          focusInput(index + 1);
        }
      }
    },
    [digits, onChange, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const newDigits = [...digits];

        if (digits[index]) {
          newDigits[index] = "";
          onChange(newDigits.join(""));
        } else if (index > 0) {
          newDigits[index - 1] = "";
          onChange(newDigits.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [digits, onChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

      if (pastedData) {
        onChange(pastedData);
        const nextIndex = Math.min(pastedData.length, length - 1);
        focusInput(nextIndex);
      }
    },
    [onChange, focusInput]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="flex items-center justify-center">
        {/* Country code - compact */}
        <span className="text-foreground-muted font-medium text-lg mr-2 flex-shrink-0">+1</span>

        {/* All 10 digits in a row with small gaps between groups */}
        <div className="flex items-center gap-2">
          {/* First 3 digits */}
          <div className="flex gap-0.5">
            {digits.slice(0, 3).map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={() => setFocusedIndex(idx)}
                onBlur={() => setFocusedIndex(null)}
                disabled={disabled}
                autoFocus={autoFocus && idx === 0}
                className={cn(
                  "w-10 h-12 text-center text-xl font-semibold rounded-[var(--radius-md)] border-2 bg-surface transition-all duration-200 relative",
                  "focus:outline-none focus:ring-0",
                  focusedIndex === idx && "z-10",
                  error
                    ? "border-status-danger text-status-danger"
                    : focusedIndex === idx
                    ? "border-accent-primary bg-accent-primary-muted/30"
                    : digit
                    ? "border-accent-primary/50 bg-accent-primary-muted/10"
                    : "border-border hover:border-foreground-muted"
                )}
                aria-label={`Phone digit ${idx + 1}`}
              />
            ))}
          </div>

          {/* Middle 3 digits */}
          <div className="flex gap-0.5">
            {digits.slice(3, 6).map((digit, idx) => {
              const actualIndex = 3 + idx;
              return (
                <input
                  key={actualIndex}
                  ref={(el) => {
                    inputRefs.current[actualIndex] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(actualIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(actualIndex, e)}
                  onPaste={handlePaste}
                  onFocus={() => setFocusedIndex(actualIndex)}
                  onBlur={() => setFocusedIndex(null)}
                  disabled={disabled}
                  className={cn(
                    "w-10 h-12 text-center text-xl font-semibold rounded-[var(--radius-md)] border-2 bg-surface transition-all duration-200 relative",
                    "focus:outline-none focus:ring-0",
                    focusedIndex === actualIndex && "z-10",
                    error
                      ? "border-status-danger text-status-danger"
                      : focusedIndex === actualIndex
                      ? "border-accent-primary bg-accent-primary-muted/30"
                      : digit
                      ? "border-accent-primary/50 bg-accent-primary-muted/10"
                      : "border-border hover:border-foreground-muted"
                  )}
                  aria-label={`Phone digit ${actualIndex + 1}`}
                />
              );
            })}
          </div>

          {/* Last 4 digits */}
          <div className="flex gap-0.5">
            {digits.slice(6, 10).map((digit, idx) => {
              const actualIndex = 6 + idx;
              return (
                <input
                  key={actualIndex}
                  ref={(el) => {
                    inputRefs.current[actualIndex] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(actualIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(actualIndex, e)}
                  onPaste={handlePaste}
                  onFocus={() => setFocusedIndex(actualIndex)}
                  onBlur={() => setFocusedIndex(null)}
                  disabled={disabled}
                  className={cn(
                    "w-10 h-12 text-center text-xl font-semibold rounded-[var(--radius-md)] border-2 bg-surface transition-all duration-200 relative",
                    "focus:outline-none focus:ring-0",
                    focusedIndex === actualIndex && "z-10",
                    error
                      ? "border-status-danger text-status-danger"
                      : focusedIndex === actualIndex
                      ? "border-accent-primary bg-accent-primary-muted/30"
                      : digit
                      ? "border-accent-primary/50 bg-accent-primary-muted/10"
                      : "border-border hover:border-foreground-muted"
                  )}
                  aria-label={`Phone digit ${actualIndex + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized component for OTP codes
interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  length?: number;
  className?: string;
}

export function OtpInput({
  value,
  onChange,
  label,
  error = false,
  disabled = false,
  autoFocus = true,
  length = 6,
  className,
}: OtpInputProps) {
  return (
    <DigitInput
      length={length}
      value={value}
      onChange={onChange}
      label={label}
      error={error}
      disabled={disabled}
      autoFocus={autoFocus}
      separator={3}
      className={className}
    />
  );
}
