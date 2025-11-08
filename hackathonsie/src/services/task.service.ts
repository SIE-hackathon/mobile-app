/**
 * Task Service
 * Handles all task-related operations with Supabase
 */

import { Task, TaskInsert, TaskStatus, TaskUpdate } from '../types/database.types';
import { supabase } from './supabase';

export class TaskService {
  /**
   * Fetch all tasks for the current user
   */
  static async fetchUserTasks(): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Only fetch tasks created by the current user
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch tasks by status
   */
  static async fetchTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch a single task by ID
   */
  static async fetchTask(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new task
   */
  static async createTask(task: TaskInsert): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const taskData = {
      ...task,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;

    // Activity logging disabled to prevent duplicates
    // Logging is handled in TaskDetailsScreen
    // await supabase.from('activity_logs').insert({
    //   task_id: data.id,
    //   user_id: user.id,
    //   action: 'task_created',
    //   new_value: JSON.stringify({
    //     title: data.title,
    //     status: data.status,
    //     priority: data.priority,
    //   }),
    // });

    return data;
  }

  /**
   * Update a task
   */
  static async updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const result = await this.updateTask(taskId, { status });

    // Activity logging disabled to prevent duplicates
    // Logging is handled in TaskDetailsScreen
    // const { data: { user } } = await supabase.auth.getUser();
    // const { data: oldTask } = await supabase
    //   .from('tasks')
    //   .select('status')
    //   .eq('id', taskId)
    //   .single();
    // if (oldTask && oldTask.status !== status) {
    //   await supabase.from('activity_logs').insert({
    //     task_id: taskId,
    //     user_id: user?.id,
    //     action: 'status_changed',
    //     old_value: JSON.stringify({ status: oldTask.status }),
    //     new_value: JSON.stringify({ status }),
    //   });
    // }

    return result;
  }

  /**
   * Update task progress
   */
  static async updateTaskProgress(taskId: string, progress: number): Promise<Task> {
    return this.updateTask(taskId, { progress });
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string): Promise<void> {
    // Get task info before deleting
    const { data: task } = await supabase
      .from('tasks')
      .select('title, status')
      .eq('id', taskId)
      .single();

    // Activity logging disabled to prevent duplicates
    // if (task) {
    //   const { data: { user } } = await supabase.auth.getUser();
    //   await supabase.from('activity_logs').insert({
    //     task_id: taskId,
    //     user_id: user?.id,
    //     action: 'task_deleted',
    //     old_value: {
    //       title: task.title,
    //       status: task.status,
    //     },
    //   });
    // }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }

  /**
   * Fetch tasks assigned to user
   */
  static async fetchAssignedTasks(): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to_user', user.id)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch subtasks
   */
  static async fetchSubtasks(parentTaskId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
