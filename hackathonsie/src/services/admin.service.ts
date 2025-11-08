/**
 * Admin Service
 * Handles admin-level operations that require special permissions
 */

import type { User } from '@supabase/supabase-js';
import { isSuperAdmin as checkJWTSuperAdmin } from '../utils/auth.utils';

export interface UserAdminData {
  id: string;
  email: string;
  role?: string;
  provider?: string;
}

export class AdminService {
  /**
   * Check if user is super-admin using JWT metadata
   * This is faster and more reliable than database queries
   */
  static checkIsSuperAdmin(user: User | null): boolean {
    if (!user) {
      return false;
    }
    return checkJWTSuperAdmin(user);
  }
}
