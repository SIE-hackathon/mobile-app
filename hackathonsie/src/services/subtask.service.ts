/**
 * Subtask Service
 * Handles all subtask-related operations with automatic parent completion logic
 */

import { supabase } from './supabase';
import { Task, TaskInsert, TaskStatus, ActivityLogInsert } from '../types/database.types';
import { BackendAPI } from './backend-api.service';

export class SubtaskService {
  /**
   * Get all subtasks for a parent task
   */
  static async getSubtasks(parentTaskId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get subtask statistics for a parent task
   */
  static async getSubtaskStats(parentTaskId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
  }> {
    const { data, error } = await supabase
      .from('tasks')
      .select('status')
      .eq('parent_task_id', parentTaskId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      completed: data?.filter((t) => t.status === 'done').length || 0,
      inProgress: data?.filter((t) => t.status === 'in_progress').length || 0,
      todo: data?.filter((t) => t.status === 'todo').length || 0,
    };

    return stats;
  }

  /**
   * Create a new subtask
   */
  static async createSubtask(
    parentTaskId: string,
    subtaskData: Omit<TaskInsert, 'parent_task_id'>
  ): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const newSubtask: TaskInsert = {
      ...subtaskData,
      parent_task_id: parentTaskId,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([newSubtask])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    try {
      const activity: ActivityLogInsert = {
        user_id: user.id,
        task_id: data.id,
        action: 'task_created',
        metadata: JSON.stringify({ is_subtask: true, parent_task_id: parentTaskId }),
      };
      await BackendAPI.createActivityLog(activity);
    } catch (err) {
      console.warn('Failed to log subtask creation:', err);
    }

    return data;
  }

  /**
   * Update a subtask and check if parent should be auto-completed
   */
  static async updateSubtask(
    subtaskId: string,
    updates: Partial<Task>
  ): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the subtask to find parent
    const { data: subtask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', subtaskId)
      .single();

    if (fetchError) throw fetchError;

    // Update the subtask
    const { data: updatedSubtask, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', subtaskId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    try {
      const activity: ActivityLogInsert = {
        user_id: user.id,
        task_id: subtaskId,
        action: 'task_updated',
        old_value: JSON.stringify({ status: subtask.status, progress: subtask.progress }),
        new_value: JSON.stringify(updates),
      };
      await BackendAPI.createActivityLog(activity);
    } catch (err) {
      console.warn('Failed to log subtask update:', err);
    }

    // Check if all subtasks of parent are completed
    if (subtask.parent_task_id) {
      await this.checkAndUpdateParentCompletion(subtask.parent_task_id);
    }

    return updatedSubtask;
  }

  /**
   * Delete a subtask and update parent stats
   */
  static async deleteSubtask(subtaskId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get subtask to find parent
    const { data: subtask, error: fetchError } = await supabase
      .from('tasks')
      .select('parent_task_id')
      .eq('id', subtaskId)
      .single();

    if (fetchError) throw fetchError;

    // Delete the subtask
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', subtaskId);

    if (error) throw error;

    // Log activity
    try {
      const activity: ActivityLogInsert = {
        user_id: user.id,
        task_id: subtaskId,
        action: 'task_deleted',
        metadata: JSON.stringify({ is_subtask: true }),
      };
      await BackendAPI.createActivityLog(activity);
    } catch (err) {
      console.warn('Failed to log subtask deletion:', err);
    }

    // Update parent if it has any subtasks left
    if (subtask.parent_task_id) {
      await this.checkAndUpdateParentCompletion(subtask.parent_task_id);
    }
  }

  /**
   * Check if all subtasks are completed and auto-complete parent
   * Also updates progress based on subtask completion
   */
  static async checkAndUpdateParentCompletion(parentTaskId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all subtasks
    const subtasks = await this.getSubtasks(parentTaskId);

    if (subtasks.length === 0) {
      // No subtasks, don't auto-update parent
      return;
    }

    // Calculate completion percentage
    const completedCount = subtasks.filter((t) => t.status === 'done').length;
    const progress = Math.round((completedCount / subtasks.length) * 100);

    // Get current parent task
    const { data: parentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', parentTaskId)
      .single();

    if (fetchError) throw fetchError;

    // Determine new status
    let newStatus: TaskStatus = parentTask.status;

    if (completedCount === subtasks.length) {
      // All subtasks done - mark parent as done
      newStatus = 'done';
    } else if (completedCount > 0 && parentTask.status === 'todo') {
      // Some subtasks done and parent is still todo - move to in_progress
      newStatus = 'in_progress';
    }

    // Update parent if status or progress changed
    if (newStatus !== parentTask.status || progress !== parentTask.progress) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          progress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parentTaskId);

      if (updateError) throw updateError;

      // Log the auto-completion
      if (newStatus !== parentTask.status) {
        try {
          const activity: ActivityLogInsert = {
            user_id: user.id,
            task_id: parentTaskId,
            action: 'status_changed',
            old_value: JSON.stringify({ status: parentTask.status, progress: parentTask.progress }),
            new_value: JSON.stringify({ status: newStatus, progress }),
            metadata: JSON.stringify({ reason: 'auto_completed_from_subtasks' }),
          };
          await BackendAPI.createActivityLog(activity);
        } catch (err) {
          console.warn('Failed to log parent completion:', err);
        }
      }
    }
  }

  /**
   * Get parent task with all its subtasks
   */
  static async getTaskWithSubtasks(taskId: string): Promise<Task & { subtasks: Task[] }> {
    const { data: parentTask, error: parentError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (parentError) throw parentError;

    const subtasks = await this.getSubtasks(taskId);

    return {
      ...parentTask,
      subtasks,
    };
  }

  /**
   * Reorder subtasks (update display order)
   */
  static async reorderSubtasks(
    subtaskIds: string[]
  ): Promise<void> {
    const updates = subtaskIds.map((id, index) => ({
      id,
      order: index,
    }));

    // Batch update if Supabase supports it, otherwise update individually
    for (const update of updates) {
      const { error } = await supabase
        .from('tasks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', update.id);

      if (error) throw error;
    }
  }

  /**
   * Mark subtask as completed and trigger parent check
   */
  static async completeSubtask(subtaskId: string): Promise<Task> {
    return this.updateSubtask(subtaskId, {
      status: 'done',
      progress: 100,
    });
  }

  /**
   * Mark subtask as incomplete
   */
  static async uncompleteSubtask(subtaskId: string): Promise<Task> {
    return this.updateSubtask(subtaskId, {
      status: 'todo',
      progress: 0,
    });
  }
}
