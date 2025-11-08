/**
 * useTasks Hook
 * Custom hook for managing tasks
 */

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskInsert, TaskUpdate, TaskStatus } from '../types/database.types';
import { TaskService } from '../services/task.service';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TaskService.fetchUserTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (task: TaskInsert) => {
    try {
      const newTask = await TaskService.createTask(task);
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: TaskUpdate) => {
    try {
      const updatedTask = await TaskService.updateTask(taskId, updates);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      return updatedTask;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      const updatedTask = await TaskService.updateTaskStatus(taskId, status);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      return updatedTask;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await TaskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
}
