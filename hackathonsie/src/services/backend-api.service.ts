/**
 * Backend API Service
 * Interfaces with the FastAPI backend
 */

import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL || 'https://your-backend-api.com';

/**
 * Get authorization header with Supabase token
 */
async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// ============================================================================
// Activity Logs
// ============================================================================

export interface ActivityLogResponse {
  id: string;
  user_id?: string;
  task_id?: string;
  group_id?: string;
  action: string;
  old_value?: any;
  new_value?: any;
  metadata?: any;
  timestamp: string;
  user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    progress: number;
  };
}

/**
 * Get activity logs for a specific task (ENRICHED with user/task data)
 */
export async function getTaskActivityLogs(
  taskId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLogResponse[]> {
  const headers = await getAuthHeader();
  
  const response = await fetch(
    `${API_BASE_URL}/api/logs/task/${taskId}?limit=${limit}&offset=${offset}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch activity logs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(limit: number = 20): Promise<ActivityLogResponse[]> {
  const headers = await getAuthHeader();
  
  const response = await fetch(
    `${API_BASE_URL}/api/logs/recent?limit=${limit}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recent activity: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user's activity logs
 */
export async function getUserActivityLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  action?: string
): Promise<ActivityLogResponse[]> {
  const headers = await getAuthHeader();
  
  let url = `${API_BASE_URL}/api/logs/user/${userId}?limit=${limit}&offset=${offset}`;
  if (action) {
    url += `&action=${action}`;
  }
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch user activity logs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all activity logs with filters
 */
export async function getAllActivityLogs(
  limit: number = 50,
  offset: number = 0,
  action?: string,
  startDate?: string,
  endDate?: string
): Promise<ActivityLogResponse[]> {
  const headers = await getAuthHeader();
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  if (action) params.append('action', action);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const response = await fetch(
    `${API_BASE_URL}/api/logs/?${params.toString()}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch activity logs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new activity log
 */
export async function createActivityLog(activity: any): Promise<ActivityLogResponse> {
  try {
    const headers = await getAuthHeader();
    
    const response = await fetch(
      `${API_BASE_URL}/api/logs/`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(activity),
      }
    );

    if (!response.ok) {
      // Fall back to Supabase if backend fails
      return fallbackCreateActivityLog(activity);
    }

    return response.json();
  } catch (error) {
    console.warn('Backend create activity log failed, using Supabase fallback:', error);
    return fallbackCreateActivityLog(activity);
  }
}

/**
 * Fallback: Create activity log directly in Supabase
 */
async function fallbackCreateActivityLog(activity: any): Promise<ActivityLogResponse> {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([activity])
    .select()
    .single();

  if (error) {
    console.error('Failed to create activity log:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// Progress Tracking
// ============================================================================

export interface ProgressResponse {
  task_id: string;
  title: string;
  current_progress: number;
  calculated_progress: number;
  has_subtasks: boolean;
  subtask_count: number;
  needs_update: boolean;
  progress_distribution: Record<string, any>;
}

export interface TaskTreeNode {
  task_id: string;
  title: string;
  progress: number;
  calculated_progress?: number;
  needs_update?: boolean;
  parent_id?: string;
  child_count: number;
  children: TaskTreeNode[];
}

/**
 * Get task progress with calculated values from subtasks
 */
export async function getTaskProgress(taskId: string): Promise<ProgressResponse> {
  const headers = await getAuthHeader();
  
  const response = await fetch(
    `${API_BASE_URL}/api/progress/${taskId}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch task progress: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get task hierarchy tree with progress
 */
export async function getTaskTree(
  taskId: string,
  includeCalculated: boolean = true
): Promise<TaskTreeNode> {
  const headers = await getAuthHeader();
  
  const response = await fetch(
    `${API_BASE_URL}/api/progress/${taskId}/tree?include_calculated=${includeCalculated}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch task tree: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update task progress manually
 */
export async function updateTaskProgress(
  taskId: string,
  progress: number
): Promise<ProgressResponse> {
  const headers = await getAuthHeader();
  
  const response = await fetch(
    `${API_BASE_URL}/api/progress/${taskId}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ progress }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update task progress: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Sync task progress with calculated progress from subtasks
 */
export async function syncTaskProgress(taskId: string): Promise<ProgressResponse> {
  const headers = await getAuthHeader();
  
  const response = await fetch(
    `${API_BASE_URL}/api/progress/${taskId}/sync`,
    {
      method: 'POST',
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to sync task progress: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Encryption (for future use)
// ============================================================================

export interface EncryptResponse {
  ciphertext: string;
  iv: string;
  tag: string;
  algorithm: string;
}

/**
 * Generate a secure encryption key
 */
export async function generateEncryptionKey(): Promise<{ key: string; algorithm: string }> {
  const headers = await getAuthHeader();
  
  const response = await fetch(
    `${API_BASE_URL}/api/encryption/generate-key`,
    {
      method: 'POST',
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to generate key: ${response.statusText}`);
  }

  return response.json();
}

export const BackendAPI = {
  // Activity Logs
  getTaskActivityLogs,
  getRecentActivity,
  getUserActivityLogs,
  getAllActivityLogs,
  createActivityLog,
  
  // Progress Tracking
  getTaskProgress,
  getTaskTree,
  updateTaskProgress,
  syncTaskProgress,
  
  // Encryption
  generateEncryptionKey,
};
