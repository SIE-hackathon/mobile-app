/**
 * User Service
 * Handles user-related queries
 */

import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  display_name?: string;
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
      .select('id, display_name, email, avatar_url')
      .order('display_name', { ascending: true });

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
      .select('id, display_name, email, avatar_url')
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('display_name', { ascending: true });

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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }
}
