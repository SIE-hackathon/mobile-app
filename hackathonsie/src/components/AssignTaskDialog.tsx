/**
 * Assign Task Dialog
 * Modal for assigning tasks to users or groups
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface AssignTaskDialogProps {
  visible: boolean;
  taskId: string;
  currentUserId?: string;
  currentGroupId?: string;
  onClose: () => void;
  onAssign: (userId?: string, groupId?: string) => Promise<void>;
}

interface User {
  id: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

export default function AssignTaskDialog({
  visible,
  taskId,
  currentUserId,
  currentGroupId,
  onClose,
  onAssign,
}: AssignTaskDialogProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedType, setSelectedType] = useState<'user' | 'group'>('user');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(currentUserId);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(currentGroupId);

  useEffect(() => {
    if (visible) {
      fetchUsersAndGroups();
    }
  }, [visible]);

  useEffect(() => {
    setSelectedUserId(currentUserId);
    setSelectedGroupId(currentGroupId);
  }, [currentUserId, currentGroupId]);

  const fetchUsersAndGroups = async () => {
    setLoading(true);
    try {
      // Fetch all users (in a real app, you might want to filter this)
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && usersData) {
        setUsers(usersData.users.map(u => ({ id: u.id, email: u.email || 'Unknown' })));
      }

      // Fetch groups that the current user is a member of
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (!groupsError && groupsData) {
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Error fetching users and groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      if (selectedType === 'user') {
        await onAssign(selectedUserId, undefined);
      } else {
        await onAssign(undefined, selectedGroupId);
      }
      onClose();
    } catch (error) {
      console.error('Error assigning task:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setAssigning(true);
    try {
      await onAssign(undefined, undefined);
      onClose();
    } catch (error) {
      console.error('Error unassigning task:', error);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'user' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('user')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'user' && styles.typeButtonTextActive,
                ]}
              >
                👤 User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'group' && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType('group')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === 'group' && styles.typeButtonTextActive,
                ]}
              >
                👥 Group
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.listContainer}>
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : selectedType === 'user' ? (
              <>
                {users.length === 0 ? (
                  <Text style={styles.emptyText}>No users available</Text>
                ) : (
                  users.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[
                        styles.listItem,
                        selectedUserId === u.id && styles.listItemSelected,
                      ]}
                      onPress={() => setSelectedUserId(u.id)}
                    >
                      <View style={styles.listItemIcon}>
                        <Text style={styles.icon}>👤</Text>
                      </View>
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>{u.email}</Text>
                        {u.id === user?.id && (
                          <Text style={styles.listItemSubtitle}>(You)</Text>
                        )}
                      </View>
                      {selectedUserId === u.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                {groups.length === 0 ? (
                  <Text style={styles.emptyText}>No groups available</Text>
                ) : (
                  groups.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.listItem,
                        selectedGroupId === g.id && styles.listItemSelected,
                      ]}
                      onPress={() => setSelectedGroupId(g.id)}
                    >
                      <View style={styles.listItemIcon}>
                        <Text style={styles.icon}>👥</Text>
                      </View>
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>{g.name}</Text>
                        {g.description && (
                          <Text style={styles.listItemSubtitle} numberOfLines={1}>
                            {g.description}
                          </Text>
                        )}
                      </View>
                      {selectedGroupId === g.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            {(currentUserId || currentGroupId) && (
              <TouchableOpacity
                style={[styles.button, styles.unassignButton]}
                onPress={handleUnassign}
                disabled={assigning}
              >
                <Text style={styles.unassignButtonText}>Unassign</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.assignButton,
                assigning && styles.buttonDisabled,
                { flex: currentUserId || currentGroupId ? 2 : 1 },
              ]}
              onPress={handleAssign}
              disabled={
                assigning ||
                (selectedType === 'user' && !selectedUserId) ||
                (selectedType === 'group' && !selectedGroupId)
              }
            >
              <Text style={styles.assignButtonText}>
                {assigning ? 'Assigning...' : 'Assign'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  centered: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 40,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  listItemSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  unassignButton: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  unassignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  assignButton: {
    backgroundColor: '#007AFF',
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
