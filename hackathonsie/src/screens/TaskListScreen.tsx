/**
 * Task List Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { Task, TaskStatus } from '../types/database.types';
import { PRIORITY_COLORS } from '../constants';
import { formatDate, isOverdue } from '../utils/date.utils';
import SettingsDropdown from '../components/SettingsDropdown';
import StatusDropdown from '../components/StatusDropdown';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

export default function TaskListScreen() {
  const { tasks, loading, fetchTasks, updateTaskStatus, deleteTask } = useTasks();
  const { signOut } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/profile' as any);
  };

  const handleThemePress = () => {
    Alert.alert('Coming Soon', 'Theme settings will be available soon!');
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
      <View style={styles.taskCard}>
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
            <Text style={[styles.dueDate, overdue && styles.overdue]}>
              Due: {formatDate(item.due_date)}
            </Text>
          )}

          {item.progress > 0 && (
            <Text style={styles.progress}>{item.progress}%</Text>
          )}
        </View>
      </View>
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
        <Text style={styles.headerTitle}>My Tasks</Text>
        <SettingsDropdown
          onProfilePress={handleProfilePress}
          onThemePress={handleThemePress}
          onLogoutPress={handleLogout}
        />
      </View>
      
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No tasks yet</Text>
          </View>
        }
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
  dueDate: {
    fontSize: 12,
    color: '#666',
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
});
