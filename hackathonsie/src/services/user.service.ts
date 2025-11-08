/**
 * User Service
 * Handles user-related queries
 */

import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export class UserService {
  /**
   * Query all users in the system
   */
  static async fetchAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('[UserService] Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Create or update user profile (upsert)
   */
  static async createUserProfile(userId: string, email: string, fullName: string = ''): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: fullName || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }

      console.log('[UserService] Ensured profile for user:', userId);
      return data;
    } catch (error) {
      console.error('[UserService] Error in createUserProfile:', error);
      return null;
    }
  }
}
