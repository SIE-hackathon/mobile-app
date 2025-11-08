/**
 * Auth Utils
 * Utility functions for authentication and authorization
 */

import { User } from '@supabase/supabase-js';

export interface SuperAdminMetadata {
  role?: string;
  provider?: string;
  providers?: string[];
}

/**
 * Check if user has super-admin role
 * Handles both parsed and stringified metadata
 * Checks multiple possible locations for metadata
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) {
    console.log('[isSuperAdmin] No user provided');
    return false;
  }

  try {
    let metadata: SuperAdminMetadata | null = null;
    
    console.log('[isSuperAdmin] Checking user object for metadata...');
    console.log('[isSuperAdmin] user.user_metadata:', user.user_metadata);
    console.log('[isSuperAdmin] user.app_metadata:', (user as any).app_metadata);
    
    // Try user_metadata first (what we set)
    if (user.user_metadata) {
      console.log('[isSuperAdmin] Found user_metadata');
      if (typeof user.user_metadata === 'string') {
        metadata = JSON.parse(user.user_metadata);
      } else {
        metadata = user.user_metadata as SuperAdminMetadata;
      }
    }
    
    // Try app_metadata (system metadata)
    if (!metadata || !metadata.role) {
      console.log('[isSuperAdmin] Checking app_metadata');
      const appMetadata = (user as any).app_metadata;
      if (appMetadata) {
        if (typeof appMetadata === 'string') {
          metadata = JSON.parse(appMetadata);
        } else {
          metadata = appMetadata as SuperAdminMetadata;
        }
      }
    }

    console.log('[isSuperAdmin] Final metadata:', metadata);
    
    if (!metadata) {
      console.log('[isSuperAdmin] No metadata found');
      return false;
    }
    
    console.log('[isSuperAdmin] role:', metadata.role);
    console.log('[isSuperAdmin] provider:', metadata.provider);
    
    const result = metadata.role === 'super-admin' && metadata.provider === 'email';
    console.log('[isSuperAdmin] Final result:', result);
    
    return result;
  } catch (error) {
    console.error('[isSuperAdmin] Error parsing user metadata:', error);
    return false;
  }
}

/**
 * Get user role from metadata
 */
export function getUserRole(user: User | null): string | null {
  if (!user) return null;

  try {
    let metadata: SuperAdminMetadata;
    
    if (typeof user.user_metadata === 'string') {
      metadata = JSON.parse(user.user_metadata);
    } else {
      metadata = user.user_metadata as SuperAdminMetadata;
    }

    return metadata?.role || null;
  } catch (error) {
    console.error('Error parsing user metadata:', error);
    return null;
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;

  try {
    let metadata: SuperAdminMetadata;
    
    if (typeof user.user_metadata === 'string') {
      metadata = JSON.parse(user.user_metadata);
    } else {
      metadata = user.user_metadata as SuperAdminMetadata;
    }

    return metadata?.role === role;
  } catch (error) {
    console.error('Error parsing user metadata:', error);
    return false;
  }
}
