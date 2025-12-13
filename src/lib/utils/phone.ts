/**
 * Phone number formatting utilities
 */

/**
 * Format a phone number for display (US format)
 * Input: +15551234567 or 5551234567
 * Output: (555) 123-4567
 */
export function formatPhoneDisplay(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // Remove leading 1 if present (US country code)
  const nationalNumber = digits.startsWith("1") && digits.length === 11
    ? digits.slice(1)
    : digits;

  if (nationalNumber.length !== 10) {
    return phone; // Return as-is if not a valid US number
  }

  return `(${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
}

/**
 * Format a phone number as user types (US format)
 * Progressively formats: 5 -> 55 -> 555 -> (555) -> (555) 1 -> (555) 12 -> (555) 123 -> (555) 123-4 -> (555) 123-45 -> (555) 123-4567
 */
export function formatPhoneInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");

  // Limit to 10 digits (US number without country code)
  const limited = digits.slice(0, 10);

  if (limited.length === 0) return "";
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

/**
 * Convert a formatted phone number to E.164 format for Supabase
 * Input: (555) 123-4567 or 5551234567
 * Output: +15551234567
 */
export function toE164(phone: string, countryCode: string = "1"): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // If already has country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Add country code
  if (digits.length === 10) {
    return `+${countryCode}${digits}`;
  }

  // Return with + prefix if it looks like it already has a country code
  if (digits.length > 10) {
    return `+${digits}`;
  }

  // Return as-is with + if incomplete
  return `+${countryCode}${digits}`;
}

/**
 * Validate if a phone number is complete (10 digits for US)
 */
export function isValidUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}
