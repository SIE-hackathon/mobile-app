/**
 * Dashboard Screen
 */

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CreateTaskDialog from '../components/CreateTaskDialog';
import GroupsDisplay from '../components/GroupsDisplay';
import SettingsDropdown from '../components/SettingsDropdown';
import StatusDropdown from '../components/StatusDropdown';
import { PRIORITY_COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { AuthService } from '../services/auth.service';
import { TaskService } from '../services/task.service';
import { Task, TaskStatus } from '../types/database.types';
import { formatDate, isOverdue } from '../utils/date.utils';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export default function DashboardScreen() {
  const { tasks, loading, fetchTasks, updateTaskStatus, deleteTask } = useTasks();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
  });

  useEffect(() => {
    if (user) {
      setIsSuperAdmin(AuthService.isSuperAdmin(user));
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [tasks]);

  // Refresh tasks when screen comes into focus (e.g., after deleting a task)
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  const calculateStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => t.due_date && isOverdue(t.due_date) && t.status !== 'done').length;

    setStats({
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      overdueTasks: overdue,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    priority: any;
    due_date: string | null;
    group_id: string | null;
  }) => {
    try {
      // Remove group_id as it's not in the tasks table
      const { group_id, ...taskPayload } = taskData;
      await TaskService.createTask(taskPayload as any);
      await fetchTasks();
      Alert.alert('Success', 'Task created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create task');
    }
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profile' as any);
  };

  const handleThemePress = () => {
    Alert.alert('Coming Soon', 'Theme settings will be available soon!');
  };

  const handleAdminPress = () => {
    router.push('/super-admin-users' as any);
  };

  const handleLogout = async () => {
    console.log('Logout button pressed');

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Calling signOut...');
              await signOut();
              console.log('SignOut complete, navigating...');
              router.replace('/' as any);
            } catch (error: any) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const overdue = isOverdue(item.due_date);

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => {
          router.push(`/task-details?taskId=${item.id}` as any);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.taskActions}>
            <StatusDropdown
              currentStatus={item.status}
              onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus)}
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTask(item.id, item.title)}
            >
              <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>

        {item.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.taskFooter}>
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] }]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>

          {item.due_date && (
            <View style={styles.dueDateContainer}>
              <Text style={styles.calendarIcon}>📅</Text>
              <Text style={[styles.dueDate, overdue && styles.overdue]}>
                {formatDate(item.due_date)}
              </Text>
            </View>
          )}

          {item.progress > 0 && (
            <Text style={styles.progress}>{item.progress}%</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerActions}>
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={handleAdminPress}
            >
              <Text style={styles.adminIcon}>👑</Text>
            </TouchableOpacity>
          )}
          <SettingsDropdown
            onProfilePress={handleProfilePress}
            onThemePress={handleThemePress}
            onLogoutPress={handleLogout}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Groups Section */}
        <GroupsDisplay />

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalTasks}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={[styles.statCard, styles.successCard]}>
              <Text style={[styles.statNumber, styles.successColor]}>{stats.completedTasks}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={[styles.statCard, styles.primaryCard]}>
              <Text style={[styles.statNumber, styles.primaryColor]}>{stats.inProgressTasks}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>

            <View style={[styles.statCard, styles.dangerCard]}>
              <Text style={[styles.statNumber, styles.dangerColor]}>{stats.overdueTasks}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        <View style={styles.tasksHeader}>
          <Text style={styles.tasksTitle}>Recent Tasks</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : tasks.filter(t => t.status !== 'done').length > 0 ? (
          tasks
            .filter(t => t.status !== 'done')
            .map((task, index) => (
              <View key={task.id || index}>
                {renderTask({ item: task })}
              </View>
            ))
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No active tasks</Text>
          </View>
        )}
      </ScrollView>

      <CreateTaskDialog
        visible={createDialogVisible}
        onClose={() => setCreateDialogVisible(false)}
        onCreate={handleCreateTask}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateDialogVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarIcon: {
    fontSize: 13,
  },
  dueDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  overdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  progress: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: '#d1fae5',
  },
  primaryCard: {
    backgroundColor: '#dbeafe',
  },
  dangerCard: {
    backgroundColor: '#fee2e2',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  successColor: {
    color: '#059669',
  },
  primaryColor: {
    color: '#2563eb',
  },
  dangerColor: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tasksHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  loader: {
    marginVertical: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 36,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff3cd',
  },
  adminIcon: {
    fontSize: 18,
  },
});

