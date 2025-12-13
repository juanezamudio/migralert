import { createClient } from "./client";

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string | null;
  contact_order: number;
  created_at: string;
}

export interface AlertConfig {
  user_id: string;
  message: string;
  share_location: boolean;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  user_id: string;
  message: string;
  is_test: boolean;
  contacts_notified: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export type CreateContactInput = {
  name: string;
  phone: string;
  relationship?: string;
};

/**
 * Get all emergency contacts for the current user
 */
export async function getEmergencyContacts(): Promise<{
  data: EmergencyContact[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("contact_order", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Add a new emergency contact
 */
export async function addEmergencyContact(
  contact: CreateContactInput
): Promise<{ data: EmergencyContact | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Get current contact count to determine order
  const { data: existing } = await supabase
    .from("emergency_contacts")
    .select("contact_order")
    .eq("user_id", user.id)
    .order("contact_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0
    ? existing[0].contact_order + 1
    : 1;

  if (nextOrder > 5) {
    return { data: null, error: "Maximum 5 contacts allowed" };
  }

  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({
      user_id: user.id,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship || null,
      contact_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Update an emergency contact
 */
export async function updateEmergencyContact(
  id: string,
  updates: Partial<CreateContactInput>
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("emergency_contacts")
    .update({
      ...(updates.name && { name: updates.name }),
      ...(updates.phone && { phone: updates.phone }),
      ...(updates.relationship !== undefined && { relationship: updates.relationship || null }),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Delete an emergency contact
 */
export async function deleteEmergencyContact(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Reorder emergency contacts
 */
export async function reorderEmergencyContacts(
  orderedIds: string[]
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // Update each contact's order
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("emergency_contacts")
      .update({ contact_order: index + 1 })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const errorResult = results.find((r) => r.error);

  if (errorResult?.error) {
    return { error: errorResult.error.message };
  }

  return { error: null };
}

/**
 * Get alert configuration for current user
 */
export async function getAlertConfig(): Promise<{
  data: AlertConfig | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("alert_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If no config exists or table doesn't exist, return default
    if (error?.code === "PGRST116" || error?.code === "42P01" || error?.message?.includes("406")) {
      return {
        data: {
          user_id: user.id,
          message: "I may have been detained by immigration authorities. Please contact a lawyer immediately.",
          share_location: true,
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    if (error) {
      // For any other error, return default config instead of failing
      console.warn("Error fetching alert config, using defaults:", error);
      return {
        data: {
          user_id: user.id,
          message: "I may have been detained by immigration authorities. Please contact a lawyer immediately.",
          share_location: true,
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    return { data, error: null };
  } catch {
    // Return default config on any error
    return {
      data: {
        user_id: user.id,
        message: "I may have been detained by immigration authorities. Please contact a lawyer immediately.",
        share_location: true,
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }
}

/**
 * Save alert configuration
 */
export async function saveAlertConfig(config: {
  message: string;
  share_location: boolean;
}): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("alert_config")
    .upsert({
      user_id: user.id,
      message: config.message,
      share_location: config.share_location,
    });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Get alert history for current user
 */
export async function getAlertHistory(limit: number = 10): Promise<{
  data: AlertHistory[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("alert_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist, return empty array
      console.warn("Error fetching alert history:", error);
      return { data: [], error: null };
    }

    return { data: data || [], error: null };
  } catch {
    return { data: [], error: null };
  }
}

/**
 * Clear alert history for current user
 */
export async function clearAlertHistory(): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("alert_history")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
