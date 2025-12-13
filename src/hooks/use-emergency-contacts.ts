"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getAlertConfig,
  saveAlertConfig,
  getAlertHistory,
  clearAlertHistory,
  type EmergencyContact,
  type AlertConfig,
  type AlertHistory,
  type CreateContactInput,
} from "@/lib/supabase/emergency-contacts";
import { useAuth } from "./use-auth";

interface UseEmergencyContactsReturn {
  contacts: EmergencyContact[];
  alertConfig: AlertConfig | null;
  alertHistory: AlertHistory[];
  loading: boolean;
  error: string | null;
  addContact: (contact: CreateContactInput) => Promise<{ error: string | null }>;
  updateContact: (id: string, updates: Partial<CreateContactInput>) => Promise<{ error: string | null }>;
  removeContact: (id: string) => Promise<{ error: string | null }>;
  updateAlertConfig: (config: { message: string; share_location: boolean }) => Promise<{ error: string | null }>;
  refreshHistory: () => Promise<void>;
  clearHistory: () => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

export function useEmergencyContacts(): UseEmergencyContactsReturn {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const result = await getAlertHistory(10);
    if (!result.error) {
      setAlertHistory(result.data || []);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setAlertConfig(null);
      setAlertHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [contactsResult, configResult, historyResult] = await Promise.all([
        getEmergencyContacts(),
        getAlertConfig(),
        getAlertHistory(10),
      ]);

      if (contactsResult.error) {
        setError(contactsResult.error);
      } else {
        setContacts(contactsResult.data || []);
      }

      if (configResult.error) {
        setError(configResult.error);
      } else {
        setAlertConfig(configResult.data);
      }

      if (!historyResult.error) {
        setAlertHistory(historyResult.data || []);
      }
    } catch (err) {
      setError("Failed to load emergency contacts");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addContact = useCallback(async (contact: CreateContactInput) => {
    const result = await addEmergencyContact(contact);
    if (!result.error && result.data) {
      setContacts((prev) => [...prev, result.data!]);
    }
    return { error: result.error };
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<CreateContactInput>) => {
    const result = await updateEmergencyContact(id, updates);
    if (!result.error) {
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    }
    return result;
  }, []);

  const removeContact = useCallback(async (id: string) => {
    const result = await deleteEmergencyContact(id);
    if (!result.error) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
    }
    return result;
  }, []);

  const updateAlertConfig = useCallback(async (config: { message: string; share_location: boolean }) => {
    const result = await saveAlertConfig(config);
    if (!result.error) {
      setAlertConfig((prev) => prev ? { ...prev, ...config } : null);
    }
    return result;
  }, []);

  const clearHistory = useCallback(async () => {
    const result = await clearAlertHistory();
    if (!result.error) {
      setAlertHistory([]);
    }
    return result;
  }, []);

  return {
    contacts,
    alertConfig,
    alertHistory,
    loading,
    error,
    addContact,
    updateContact,
    removeContact,
    updateAlertConfig,
    refreshHistory: fetchHistory,
    clearHistory,
    refresh: fetchData,
  };
}
