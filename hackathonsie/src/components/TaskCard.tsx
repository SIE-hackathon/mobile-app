/**
 * Task Card Component (Redesigned)
 * Displays task with optional subtasks in an expandable/collapsible view
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Task, TaskStatus, TaskPriority } from '../types/database.types';
import { SubtaskService } from '../services/subtask.service';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onSubtaskPress?: (subtask: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  showSubtasks?: boolean;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#DC2626',
  urgent: '#7C3AED',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#6B7280',
  in_progress: '#3B82F6',
  review: '#F59E0B',
  done: '#10B981',
};

export default function TaskCard({
  task,
  onPress,
  onSubtaskPress,
  onStatusChange,
  showSubtasks = true,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [subtaskStats, setSubtaskStats] = useState({ total: 0, completed: 0 });

  // Load subtasks when expanded
  useEffect(() => {
    if (expanded && showSubtasks && subtasks.length === 0) {
      loadSubtasks();
    }
  }, [expanded]);

  const loadSubtasks = async () => {
    try {
      setLoadingSubtasks(true);
      const tasks = await SubtaskService.getSubtasks(task.id);
      setSubtasks(tasks);
      
      const stats = await SubtaskService.getSubtaskStats(task.id);
      setSubtaskStats({
        total: stats.total,
        completed: stats.completed,
      });
    } catch (error) {
      console.error('Error loading subtasks:', error);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  const handleStatusToggle = () => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    onStatusChange?.(task.id, newStatus);
  };

  const hasSubtasks = showSubtasks && (task.subtask_count || subtaskStats.total > 0);
  const completionPercent = subtaskStats.total > 0 
    ? Math.round((subtaskStats.completed / subtaskStats.total) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Main Task Card */}
      <TouchableOpacity
        style={[
          styles.taskCard,
          task.status === 'done' && styles.taskCardCompleted,
        ]}
        activeOpacity={0.7}
      >
        {/* Left: Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            task.status === 'done' && styles.checkboxChecked,
          ]}
          onPress={handleStatusToggle}
        >
          {task.status === 'done' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Center: Task Details */}
        <TouchableOpacity
          style={styles.taskContent}
          onPress={() => onPress(task)}
          activeOpacity={0.6}
        >
          <View style={styles.taskHeader}>
            <Text
              style={[
                styles.taskTitle,
                task.status === 'done' && styles.taskTitleCompleted,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: PRIORITY_COLORS[task.priority] },
              ]}
            >
              <Text style={styles.priorityText}>
                {task.priority.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          {task.description && (
            <Text style={styles.taskDescription} numberOfLines={1}>
              {task.description}
            </Text>
          )}

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${task.progress || 0}%` },
                  { backgroundColor: STATUS_COLORS[task.status] },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{task.progress || 0}%</Text>
          </View>

          {/* Status */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: STATUS_COLORS[task.status] },
              ]}
            >
              <Text style={styles.statusText}>
                {task.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right: Expand Button (if has subtasks) */}
        {hasSubtasks && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => {
              setExpanded(!expanded);
            }}
          >
            <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
            {subtaskStats.total > 0 && (
              <View style={styles.subtaskBadge}>
                <Text style={styles.subtaskBadgeText}>
                  {subtaskStats.completed}/{subtaskStats.total}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Subtasks (Expanded) */}
      {expanded && hasSubtasks && (
        <View style={styles.subtasksContainer}>
          {loadingSubtasks ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading subtasks...</Text>
            </View>
          ) : subtasks.length === 0 ? (
            <Text style={styles.emptySubtasksText}>No subtasks yet</Text>
          ) : (
            <FlatList
              data={subtasks}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item: subtask }) => (
                <View style={styles.subtaskItem}>
                  <TouchableOpacity
                    style={[
                      styles.subtaskCheckbox,
                      subtask.status === 'done' && styles.subtaskCheckboxChecked,
                    ]}
                    onPress={() => onStatusChange?.(subtask.id, subtask.status === 'done' ? 'todo' : 'done')}
                  >
                    {subtask.status === 'done' && (
                      <Text style={styles.subtaskCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.subtaskContent}
                    onPress={() => onSubtaskPress?.(subtask)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.subtaskTitle,
                        subtask.status === 'done' && styles.subtaskTitleCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {subtask.title}
                    </Text>
                    <View style={styles.subtaskMeta}>
                      <View
                        style={[
                          styles.subtaskStatusBadge,
                          { backgroundColor: STATUS_COLORS[subtask.status] },
                        ]}
                      >
                        <Text style={styles.subtaskStatusText}>
                          {subtask.status.replace('_', ' ')}
                        </Text>
                      </View>
                      {subtask.priority && (
                        <View
                          style={[
                            styles.subtaskPriorityBadge,
                            { backgroundColor: PRIORITY_COLORS[subtask.priority] },
                          ]}
                        >
                          <Text style={styles.subtaskPriorityText}>
                            {subtask.priority.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardCompleted: {
    backgroundColor: '#F9FAFB',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  taskTitleCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    minWidth: 28,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  expandButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  subtaskBadge: {
    marginTop: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subtaskBadgeText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  subtasksContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 2,
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  emptySubtasksText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
  subtaskItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  subtaskCheckboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  subtaskCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtaskContent: {
    flex: 1,
  },
  subtaskTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  subtaskTitleCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  subtaskMeta: {
    flexDirection: 'row',
    gap: 4,
  },
  subtaskStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subtaskStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  subtaskPriorityBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  subtaskPriorityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
