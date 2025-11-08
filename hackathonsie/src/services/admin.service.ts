/**
 * Admin Service
 * Handles admin-level operations that require special permissions
 */

import { supabase } from './supabase';

export interface UserAdminData {
  id: string;
  email: string;
  role?: string;
  provider?: string;
}

export class AdminService {
  /**
   * Get user's admin metadata from auth.users table
   * This reads the raw_app_meta_data directly from the database
   */
  static async getUserAdminMetadata(userId: string): Promise<{ role?: string; provider?: string } | null> {
    try {
      const { data, error } = await supabase
        .from('auth.users')
        .select('raw_app_meta_data')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AdminService] Error fetching user metadata:', error);
        return null;
      }

      if (!data || !data.raw_app_meta_data) {
        return null;
      }

      // Parse if it's a string
      if (typeof data.raw_app_meta_data === 'string') {
        return JSON.parse(data.raw_app_meta_data);
      }

      return data.raw_app_meta_data;
    } catch (error) {
      console.error('[AdminService] Error in getUserAdminMetadata:', error);
      return null;
    }
  }

  /**
   * Check if user is super-admin by fetching from database
   */
  static async checkIsSuperAdmin(userId: string): Promise<boolean> {
    const metadata = await this.getUserAdminMetadata(userId);
    
    if (!metadata) {
      console.log('[AdminService] No metadata found for user');
      return false;
    }

    console.log('[AdminService] User metadata:', metadata);
    const result = metadata.role === 'super-admin' && metadata.provider === 'email';
    console.log('[AdminService] Is super-admin:', result);
    
    return result;
  }
}
