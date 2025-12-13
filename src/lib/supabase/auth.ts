import { createClient } from "./client";
import type { User, Session } from "@supabase/supabase-js";

export type AuthError = {
  message: string;
  code?: string;
};

export type AuthResult<T = void> = {
  data: T | null;
  error: AuthError | null;
};

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResult<{ user: User | null }>> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return {
    data: { user: data.user },
    error: null,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return {
    data: { user: data.user, session: data.session },
    error: null,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return { data: null, error: null };
}

/**
 * Get the current session
 */
export async function getSession(): Promise<AuthResult<Session>> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return {
    data: data.session,
    error: null,
  };
}

/**
 * Get the current user
 */
export async function getUser(): Promise<AuthResult<User>> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return {
    data: data.user,
    error: null,
  };
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return { data: null, error: null };
}

/**
 * Update user password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return { data: null, error: null };
}

/**
 * Send OTP to phone number for sign up/sign in
 */
export async function signInWithPhone(phone: string): Promise<AuthResult> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return { data: null, error: null };
}

/**
 * Verify phone OTP
 */
export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return {
    data: { user: data.user, session: data.session },
    error: null,
  };
}

/**
 * Remove phone number from user account
 */
export async function removePhone(): Promise<AuthResult> {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    phone: "",
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, code: error.code },
    };
  }

  return { data: null, error: null };
}
