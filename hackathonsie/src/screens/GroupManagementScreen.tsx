/**
 * Group Management Screen
 * Admin-only screen for managing groups and their members
 * Only accessible to users with super-admin role
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddGroupDialog from '../components/AddGroupDialog';
import EditGroupDialog from '../components/EditGroupDialog';
import ManageGroupMembersDialog from '../components/ManageGroupMembersDialog';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/admin.service';
import { GroupService } from '../services/group.service';
import { UserProfile, UserService } from '../services/user.service';
import { Group, GroupMember } from '../types/database.types';

interface GroupWithMemberCount extends Group {
  memberCount: number;
}

export default function GroupManagementScreen() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<GroupWithMemberCount[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<(GroupMember & { user?: UserProfile })[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  // Check if user is super-admin using JWT metadata
  useEffect(() => {
    const checkAdmin = async () => {
      setCheckingAdmin(true);

      console.log('=== GroupManagementScreen Debug ===');
      console.log('authLoading:', authLoading);
      console.log('user:', user?.email);

      if (user) {
        // Use JWT metadata - no database query needed
        const isAdmin = AdminService.checkIsSuperAdmin(user);
        console.log('Is Super Admin:', isAdmin);
        setIsAdmin(isAdmin);
      } else {
        setIsAdmin(false);
      }

      console.log('===================================');
      setCheckingAdmin(false);
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!checkingAdmin && !authLoading) {
      if (!isAdmin) {
        Alert.alert('Access Denied', 'You do not have permission to access this screen.');
        return;
      }
      loadGroupsAndUsers();
    }
  }, [checkingAdmin, authLoading, isAdmin]);

  const loadGroupsAndUsers = async () => {
    try {
      setLoading(true);
      const [groupsData, usersData] = await Promise.all([
        GroupService.fetchUserGroups(),
        UserService.fetchAllUsers(),
      ]);

      console.log('[GroupManagementScreen] Loaded users:', usersData);
      console.log('[GroupManagementScreen] Users count:', usersData.length);

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        groupsData.map(async (group: Group) => {
          try {
            const members = await GroupService.fetchGroupMembers(group.id);
            return { ...group, memberCount: members.length };
          } catch (err) {
            console.error(`Error fetching members for group ${group.id}:`, err);
            return { ...group, memberCount: 0 };
          }
        })
      );

      setGroups(groupsWithCounts);
      setAllUsers(usersData);
    } catch (error) {
      console.error('Error loading groups and users:', error);
      Alert.alert('Error', 'Failed to load groups and users.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (groupName: string, description: string) => {
    try {
      const newGroup = await GroupService.createGroup({
        name: groupName,
        description,
        created_by: '', // Will be set by createGroup
      } as any);
      setShowAddDialog(false);
      await loadGroupsAndUsers();
      Alert.alert('Success', 'Group created successfully.');
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group.');
    }
  };

  const handleEditGroup = async (groupName: string, description: string) => {
    if (!selectedGroup) return;

    try {
      await GroupService.updateGroup(selectedGroup.id, {
        name: groupName,
        description,
      });
      setShowEditDialog(false);
      setSelectedGroup(null);
      await loadGroupsAndUsers();
      Alert.alert('Success', 'Group updated successfully.');
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert('Error', 'Failed to update group.');
    }
  };

  const handleDeleteGroup = (group: Group) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await GroupService.deleteGroup(group.id);
              await loadGroupsAndUsers();
              Alert.alert('Success', 'Group deleted successfully.');
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group.');
            }
          },
        },
      ]
    );
  };

  const handleOpenMembers = async (group: Group) => {
    try {
      setSelectedGroup(group);
      const members = await GroupService.fetchGroupMembers(group.id);
      console.log('[GroupManagementScreen] Fetched members:', members);

      // Enrich members with user data
      const enrichedMembers = await Promise.all(
        members.map(async (member) => {
          const userProfile = await UserService.getUserProfile(member.user_id);
          console.log(`[GroupManagementScreen] User profile for ${member.user_id}:`, userProfile);
          return { ...member, user: userProfile || undefined };
        })
      );

      console.log('[GroupManagementScreen] Enriched members:', enrichedMembers);
      setGroupMembers(enrichedMembers as any);
      setShowMembersDialog(true);
    } catch (error) {
      console.error('Error loading group members:', error);
      Alert.alert('Error', 'Failed to load group members.');
    }
  };

  const handleAddMember = async (userId: string, role: 'owner' | 'admin' | 'member') => {
    if (!selectedGroup) return;

    try {
      await GroupService.addGroupMember({
        group_id: selectedGroup.id,
        user_id: userId,
        role,
      });
      await handleOpenMembers(selectedGroup);
      Alert.alert('Success', 'Member added to group.');
    } catch (error: any) {
      console.error('Error adding member:', error);
      if (error.message?.includes('duplicate')) {
        Alert.alert('Error', 'This user is already in the group.');
      } else {
        Alert.alert('Error', 'Failed to add member to group.');
      }
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove "${memberName}" from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await GroupService.removeGroupMember(memberId);
              if (selectedGroup) {
                await handleOpenMembers(selectedGroup);
              }
              Alert.alert('Success', 'Member removed from group.');
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'owner' | 'admin' | 'member') => {
    try {
      await GroupService.updateMemberRole(memberId, newRole);
      if (selectedGroup) {
        await handleOpenMembers(selectedGroup);
      }
      Alert.alert('Success', 'Member role updated.');
    } catch (error) {
      console.error('Error updating member role:', error);
      Alert.alert('Error', 'Failed to update member role.');
    }
  };

  if (authLoading || checkingAdmin) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12, color: '#666' }}>Verifying permissions...</Text>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>Only super-admins can access this screen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Group Management</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddDialog(true)}
          >
            <Text style={styles.addButtonText}>+ Add Group</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Create your first group to get started</Text>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item: group }) => (
              <View style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMembers}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</Text>
                  </View>
                </View>

                {group.description && (
                  <Text style={styles.groupDescription}>{group.description}</Text>
                )}

                <View style={styles.groupActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.membersButton]}
                    onPress={() => handleOpenMembers(group)}
                  >
                    <Text style={styles.actionButtonText}>Manage Members</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      setSelectedGroup(group);
                      setShowEditDialog(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteGroup(group)}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>

      {/* Dialogs */}
      <AddGroupDialog
        visible={showAddDialog}
        onDismiss={() => setShowAddDialog(false)}
        onAdd={handleAddGroup}
      />

      {selectedGroup && (
        <>
          <EditGroupDialog
            visible={showEditDialog}
            group={selectedGroup}
            onDismiss={() => {
              setShowEditDialog(false);
              setSelectedGroup(null);
            }}
            onUpdate={handleEditGroup}
          />

          <ManageGroupMembersDialog
            visible={showMembersDialog}
            group={selectedGroup}
            members={groupMembers}
            allUsers={allUsers}
            onDismiss={() => {
              setShowMembersDialog(false);
              setSelectedGroup(null);
              setGroupMembers([]);
            }}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onUpdateRole={handleUpdateMemberRole}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 13,
    color: '#999',
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  membersButton: {
    backgroundColor: '#34C759',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
  },
});
