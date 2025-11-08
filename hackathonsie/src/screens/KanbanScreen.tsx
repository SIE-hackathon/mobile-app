/**
 * Kanban Board Screen
 * Displays tasks in columns by status with tab navigation
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '../hooks/useTasks';
import { Task, TaskStatus } from '../types/database.types';
import { STATUS_COLORS, PRIORITY_COLORS } from '../constants';
import { formatDate, isOverdue } from '../utils/date.utils';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

const STATUS_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'done', label: 'Done' },
];

export default function KanbanScreen() {
  const router = useRouter();
  const { tasks, loading, fetchTasks, updateTaskStatus } = useTasks();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskStatus>('todo');

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleTaskPress = (task: Task) => {
    // Navigate to task details
    router.push(`/task-details?taskId=${task.id}`);
  };

  const renderTask = (task: Task) => {
    const overdue = isOverdue(task.due_date);

    return (
      <TouchableOpacity 
        key={task.id}
        style={styles.taskCard}
        onPress={() => handleTaskPress(task)}
      >
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.title}
        </Text>

        {task.description && (
          <Text style={styles.taskDescription} numberOfLines={1}>
            {task.description}
          </Text>
        )}

        <View style={styles.taskFooter}>
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
            <Text style={styles.priorityText}>{task.priority[0].toUpperCase()}</Text>
          </View>

          {task.due_date && (
            <Text style={[styles.dueDate, overdue && styles.overdue]}>
              {formatDate(task.due_date)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderColumn = ({ status, label }: { status: TaskStatus; label: string }) => {
    const columnTasks = getTasksByStatus(status);

    return (
      <View key={status} style={styles.columnContent}>
        {columnTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No {label.toLowerCase()} tasks</Text>
          </View>
        ) : (
          columnTasks.map(renderTask)
        )}
      </View>
    );
  };

  const activeTasks = getTasksByStatus(activeTab);
  const activeColumn = STATUS_COLUMNS.find(col => col.status === activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kanban Board</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {STATUS_COLUMNS.map(({ status, label }) => {
          const taskCount = getTasksByStatus(status).length;
          const isActive = activeTab === status;
          
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.tab,
                isActive && styles.activeTab,
                { borderBottomColor: STATUS_COLORS[status] }
              ]}
              onPress={() => setActiveTab(status)}
            >
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {label}
              </Text>
              <View style={[styles.tabBadge, { backgroundColor: STATUS_COLORS[status] }]}>
                <Text style={styles.tabCount}>{taskCount}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Column Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.columnContent}>
          {activeTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No {activeColumn?.label.toLowerCase()} tasks</Text>
              <Text style={styles.emptyHint}>Tap a task in another column to move it here</Text>
            </View>
          ) : (
            activeTasks.map(renderTask)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: STATUS_BAR_HEIGHT,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#000',
    fontWeight: '700',
  },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  columnContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    lineHeight: 22,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 24,
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  overdue: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});
