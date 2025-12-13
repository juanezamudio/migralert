"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  signInWithPhone as authSignInWithPhone,
  verifyPhoneOtp as authVerifyPhoneOtp,
} from "@/lib/supabase/auth";
import type { User, Session } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authSignIn(email, password);
    if (result.error) {
      return { error: result.error.message };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await authSignUp(email, password);
    if (result.error) {
      return { error: result.error.message, needsConfirmation: false };
    }
    // Check if email confirmation is required
    const needsConfirmation = result.data?.user?.identities?.length === 0 ||
      result.data?.user?.email_confirmed_at === null;
    return { error: null, needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    const result = await authSignOut();
    if (result.error) {
      return { error: result.error.message };
    }
    return { error: null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const result = await authResetPassword(email);
    if (result.error) {
      return { error: result.error.message };
    }
    return { error: null };
  }, []);

  const signInWithPhone = useCallback(async (phone: string) => {
    const result = await authSignInWithPhone(phone);
    if (result.error) {
      return { error: result.error.message };
    }
    return { error: null };
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    const result = await authVerifyPhoneOtp(phone, token);
    if (result.error) {
      return { error: result.error.message };
    }
    return { error: null };
  }, []);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithPhone,
    verifyPhoneOtp,
    refreshUser,
  };
}
