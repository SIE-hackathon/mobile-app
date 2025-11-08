/**
 * Task Details Screen
 * Shows full task information and activity timeline
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AssignTaskDialog from '../components/AssignTaskDialog';
import EditTaskDialog from '../components/EditTaskDialog';
import StatusDropdown from '../components/StatusDropdown';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { ActivityAction, ActivityLog, Task } from '../types/database.types';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

const PRIORITY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#991B1B',
};

const ACTION_ICONS: Record<ActivityAction, string> = {
  task_created: '✨',
  task_updated: '✏️',
  task_assigned: '👤',
  status_changed: '🔄',
  task_deleted: '🗑️',
  group_created: '📁',
  group_updated: '📝',
  member_added: '➕',
  member_removed: '➖',
  role_changed: '🔐',
};

const ACTION_LABELS: Record<ActivityAction, string> = {
  task_created: 'Task Created',
  task_updated: 'Task Updated',
  task_assigned: 'Task Assigned',
  status_changed: 'Status Changed',
  task_deleted: 'Task Deleted',
  group_created: 'Group Created',
  group_updated: 'Group Updated',
  member_added: 'Member Added',
  member_removed: 'Member Removed',
  role_changed: 'Role Changed',
};

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;

  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    if (taskId) {
      console.log('Task ID:', taskId);
      fetchTaskDetails();
      fetchActivityLog();
    }
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        // Task was deleted or not found
        if (error.code === 'PGRST116') {
          console.log('Task was deleted');
          Alert.alert('Task Deleted', 'This task has been deleted.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return;
        }
        throw error;
      }
      setTask(data);
    } catch (error) {
      console.error('Error fetching task:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      console.log('Fetching activity logs for task:', taskId);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      console.log('Activity logs received:', data?.length || 0, 'entries');
      console.log('Activity data:', JSON.stringify(data, null, 2));
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;

      // Log the status change
      await supabase.from('activity_logs').insert({
        task_id: task.id,
        action: 'status_changed',
        old_value: JSON.stringify({ status: task.status }),
        new_value: JSON.stringify({ status: newStatus }),
      });

      setTask({ ...task, status: newStatus as any });
      fetchActivityLog(); // Refresh activity log
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEditTask = async (updates: Partial<Task>) => {
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id);

      if (error) throw error;

      // Activity logging disabled - causing enum errors
      // TODO: Fix activity_action enum in database to match all possible actions
      // await supabase.from('activity_logs').insert({
      //   task_id: task.id,
      //   user_id: user?.id,
      //   action: 'task_updated',
      //   old_value: JSON.stringify({
      //     title: task.title,
      //     description: task.description,
      //     priority: task.priority,
      //     progress: task.progress,
      //     due_date: task.due_date,
      //   }),
      //   new_value: JSON.stringify(updates),
      // });

      setTask({ ...task, ...updates } as Task);
      fetchActivityLog();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const handleAssignTask = async (userId?: string, groupId?: string) => {
    if (!task) return;

    try {
      const updates: Partial<Task> = {
        assigned_to_user: userId,
        assigned_to_group: groupId,
      };

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id);

      if (error) throw error;

      // Log the assignment
      await supabase.from('activity_logs').insert({
        task_id: task.id,
        user_id: user?.id,
        action: 'task_assigned',
        old_value: JSON.stringify({
          assigned_to_user: task.assigned_to_user,
          assigned_to_group: task.assigned_to_group,
        }),
        new_value: JSON.stringify(updates),
      });

      // Also create task assignment record
      if (userId || groupId) {
        await supabase.from('task_assignments').insert({
          task_id: task.id,
          assigned_from: user?.id,
          assigned_to_user: userId,
          assigned_to_group: groupId,
          assignment_type: 'manual',
        });
      }

      setTask({ ...task, ...updates } as Task);
      fetchActivityLog();
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id);

              if (error) throw error;

              // Navigate back after successful deletion
              Alert.alert('Success', 'Task deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseJsonValue = (value: any) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  };

  const getActivityDescription = (activity: ActivityLog): string => {
    const oldValue = parseJsonValue(activity.old_value);
    const newValue = parseJsonValue(activity.new_value);

    switch (activity.action) {
      case 'status_changed':
        return `Status changed from "${oldValue?.status || 'unknown'}" to "${newValue?.status || 'unknown'}"`;
      case 'task_updated':
        const changes: string[] = [];
        if (newValue?.title && oldValue?.title !== newValue?.title) {
          changes.push('title');
        }
        if (newValue?.description !== undefined && oldValue?.description !== newValue?.description) {
          changes.push('description');
        }
        if (newValue?.priority && oldValue?.priority !== newValue?.priority) {
          changes.push(`priority (${oldValue?.priority} → ${newValue?.priority})`);
        }
        if (newValue?.progress !== undefined && oldValue?.progress !== newValue?.progress) {
          changes.push(`progress (${oldValue?.progress}% → ${newValue?.progress}%)`);
        }
        if (newValue?.due_date !== undefined && oldValue?.due_date !== newValue?.due_date) {
          changes.push('due date');
        }
        return changes.length > 0
          ? `Updated: ${changes.join(', ')}`
          : 'Task details were updated';
      case 'task_assigned':
        if (newValue?.assigned_to_user) {
          return 'Task assigned to a user';
        } else if (newValue?.assigned_to_group) {
          return 'Task assigned to a group';
        } else {
          return 'Task unassigned';
        }
      case 'task_created':
        return newValue?.title ? `Task "${newValue.title}" was created` : 'Task was created';
      case 'task_deleted':
        return oldValue?.title ? `Task "${oldValue.title}" was deleted` : 'Task was deleted';
      default:
        return ACTION_LABELS[activity.action] || 'Activity performed';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && task?.status !== 'done';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  const overdue = isOverdue(task.due_date);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Task Card */}
        <View style={styles.taskCard}>
          <Text style={styles.taskTitle}>{task.title}</Text>

          {task.description && (
            <Text style={styles.taskDescription}>{task.description}</Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => setShowEditDialog(true)}
            >
              <Text style={styles.actionButtonIcon}>✏️</Text>
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.assignButton]}
              onPress={() => setShowAssignDialog(true)}
            >
              <Text style={styles.actionButtonIcon}>👤</Text>
              <Text style={styles.actionButtonText}>Assign</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteTask}
            >
              <Text style={styles.actionButtonIcon}>🗑️</Text>
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskMeta}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status:</Text>
              <StatusDropdown
                currentStatus={task.status}
                onStatusChange={handleStatusChange}
              />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Priority:</Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: PRIORITY_COLORS[task.priority] },
                ]}
              >
                <Text style={styles.priorityText}>{task.priority}</Text>
              </View>
            </View>

            {task.due_date && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Due Date:</Text>
                <View style={styles.dueDateContainer}>
                  <Text style={styles.calendarIcon}>📅</Text>
                  <Text style={[styles.dueDate, overdue && styles.overdue]}>
                    {formatDate(task.due_date)}
                  </Text>
                </View>
              </View>
            )}

            {task.progress > 0 && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Progress:</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${task.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{task.progress}%</Text>
                </View>
              </View>
            )}

            {(task.assigned_to_user || task.assigned_to_group) && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Assigned to:</Text>
                <View style={styles.assignedBadge}>
                  <Text style={styles.assignedIcon}>
                    {task.assigned_to_group ? '👥' : '👤'}
                  </Text>
                  <Text style={styles.assignedText}>
                    {task.assigned_to_group ? 'Group' : 'User'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Activity Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>
            Activity Timeline ({activities.length})
          </Text>

          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No activity yet</Text>
          ) : (
            <View style={styles.timeline}>
              {activities.map((activity, index) => (
                <View key={activity.id} style={styles.timelineItem}>
                  {/* Timeline connector */}
                  {index < activities.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}

                  {/* Activity icon */}
                  <View style={styles.timelineIcon}>
                    <Text style={styles.activityIcon}>
                      {ACTION_ICONS[activity.action] || '📝'}
                    </Text>
                  </View>

                  {/* Activity content */}
                  <View style={styles.timelineContent}>
                    <Text style={styles.activityTitle}>
                      {ACTION_LABELS[activity.action]}
                    </Text>
                    <Text style={styles.activityDescription}>
                      {getActivityDescription(activity)}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatDateTime(activity.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <EditTaskDialog
        visible={showEditDialog}
        task={task}
        onClose={() => setShowEditDialog(false)}
        onSave={handleEditTask}
      />

      <AssignTaskDialog
        visible={showAssignDialog}
        taskId={task.id}
        currentUserId={task.assigned_to_user}
        currentGroupId={task.assigned_to_group}
        onClose={() => setShowAssignDialog(false)}
        onAssign={handleAssignTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: STATUS_BAR_HEIGHT,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  taskDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  taskMeta: {
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarIcon: {
    fontSize: 16,
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  overdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 40,
  },
  timelineSection: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 24,
  },
  timelineConnector: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  activityIcon: {
    fontSize: 20,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  assignButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  assignedIcon: {
    fontSize: 14,
  },
  assignedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
});
