/**
 * Kanban Board Screen
 * Displays tasks in columns by status
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { Task, TaskStatus } from '../types/database.types';
import { STATUS_COLORS, PRIORITY_COLORS } from '../constants';
import { formatDate, isOverdue } from '../utils/date.utils';

const STATUS_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'done', label: 'Done' },
];

export default function KanbanScreen() {
  const { tasks, loading, fetchTasks, updateTaskStatus } = useTasks();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleTaskPress = async (task: Task) => {
    // Cycle through statuses when tapped
    const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    try {
      await updateTaskStatus(task.id, nextStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
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
      <View key={status} style={styles.column}>
        <View style={[styles.columnHeader, { backgroundColor: STATUS_COLORS[status] }]}>
          <Text style={styles.columnTitle}>{label}</Text>
          <View style={styles.columnBadge}>
            <Text style={styles.columnCount}>{columnTasks.length}</Text>
          </View>
        </View>

        <ScrollView style={styles.columnContent} showsVerticalScrollIndicator={false}>
          {columnTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks</Text>
          ) : (
            columnTasks.map(renderTask)
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        style={styles.board}
        contentContainerStyle={styles.boardContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsHorizontalScrollIndicator={false}
      >
        {STATUS_COLUMNS.map(renderColumn)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  board: {
    flex: 1,
  },
  boardContent: {
    padding: 16,
    gap: 16,
    flexDirection: 'row',
  },
  column: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  columnBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  columnCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  columnContent: {
    flex: 1,
    padding: 12,
  },
  taskCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dueDate: {
    fontSize: 11,
    color: '#666',
  },
  overdue: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
