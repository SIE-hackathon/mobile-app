/**
 * Authentication Service
 * Handles all authentication operations with Supabase
 */

import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');

    return data.user;
  }

  /**
   * Verify email with OTP token
   */
  static async verifyOtp(email: string, token: string): Promise<Session> {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) throw error;
    if (!data.session) throw new Error('OTP verification failed');

    return data.session;
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session) throw new Error('Sign in failed');

    return data.session;
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current session
   */
  static async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Get current user
   */
  static async getUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string): Promise<User> {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Password update failed');

    return data.user;
  }

  /**
   * Check if user is super admin
   */
  static isSuperAdmin(user: User | null): boolean {
    if (!user) return false;

    // Check both app_metadata and raw_app_meta_data for compatibility
    const appMetaData = (user.app_metadata || user.user_metadata) as any;
    return appMetaData?.role === 'super-admin';
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }
}
