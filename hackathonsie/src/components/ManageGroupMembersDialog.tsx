/**
 * Manage Group Members Dialog
 * Modal dialog for adding/removing group members and changing roles
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import { Group, GroupMember, GroupMemberRole } from '../types/database.types';
import { UserProfile } from '../services/user.service';

interface ManageGroupMembersDialogProps {
  visible: boolean;
  group: Group | null;
  members: (GroupMember & { user?: UserProfile })[];
  allUsers: UserProfile[];
  onDismiss: () => void;
  onAddMember: (userId: string, role: GroupMemberRole) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
  onUpdateRole: (memberId: string, newRole: GroupMemberRole) => void;
}

const ROLE_OPTIONS: { label: string; value: GroupMemberRole; color: string }[] = [
  { label: 'Owner', value: 'owner', color: '#FF3B30' },
  { label: 'Admin', value: 'admin', color: '#FF9500' },
  { label: 'Member', value: 'member', color: '#34C759' },
];

export default function ManageGroupMembersDialog({
  visible,
  group,
  members,
  allUsers,
  onDismiss,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
}: ManageGroupMembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<GroupMemberRole>('member');
  const [showAddMember, setShowAddMember] = useState(false);

  // Filter users that are not already in the group
  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter((user) => !memberUserIds.has(user.id));

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = (userId: string) => {
    onAddMember(userId, selectedRole);
    setSearchQuery('');
    setSelectedRole('member');
    setShowAddMember(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.closeButton}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Manage Members</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddMember(!showAddMember)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Add Member Section */}
          {showAddMember && (
            <View style={styles.addMemberSection}>
              <Text style={styles.sectionTitle}>Add Member</Text>

              <View style={styles.roleSelector}>
                <Text style={styles.label}>Select Role</Text>
                <View style={styles.roleBadges}>
                  {ROLE_OPTIONS.map((role) => (
                    <Pressable
                      key={role.value}
                      style={[
                        styles.roleBadge,
                        selectedRole === role.value && styles.roleBadgeActive,
                        { borderColor: role.color },
                      ]}
                      onPress={() => setSelectedRole(role.value)}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          selectedRole === role.value && styles.roleBadgeTextActive,
                          { color: role.color },
                        ]}
                      >
                        {role.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users by name or email"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#ccc"
                />
              </View>

              {filteredUsers.length === 0 ? (
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No users found' : 'All users are already members'}
                </Text>
              ) : (
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item: user }) => (
                    <TouchableOpacity
                      style={styles.userItem}
                      onPress={() => handleAddMember(user.id)}
                    >
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.display_name || user.email}</Text>
                        {user.email && user.display_name && (
                          <Text style={styles.userEmail}>{user.email}</Text>
                        )}
                      </View>
                      <Text style={styles.addIcon}>+</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          {/* Members List */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Group Members ({members.length})</Text>

            {members.length === 0 ? (
              <Text style={styles.emptyText}>No members in this group</Text>
            ) : (
              <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: member }) => (
                  <View style={styles.memberCard}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.user?.display_name || member.user?.email || 'Unknown User'}
                      </Text>
                      <Text style={styles.memberEmail}>{member.user?.email}</Text>
                    </View>

                    <View style={styles.memberActions}>
                      <Pressable
                        style={styles.roleButton}
                        onPress={() => {
                          const roles: GroupMemberRole[] = ['owner', 'admin', 'member'];
                          const currentIndex = roles.indexOf(member.role);
                          const nextRole = roles[(currentIndex + 1) % roles.length];
                          onUpdateRole(member.id, nextRole);
                        }}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            {
                              color: ROLE_OPTIONS.find((r) => r.value === member.role)?.color ||
                                '#666',
                            },
                          ]}
                        >
                          {member.role}
                        </Text>
                      </Pressable>

                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() =>
                          onRemoveMember(
                            member.id,
                            member.user?.display_name || member.user?.email || 'User'
                          )
                        }
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    fontSize: 16,
    color: '#999',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addMemberSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  membersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  roleSelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  roleBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleBadgeActive: {
    backgroundColor: '#f0f0f0',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  roleBadgeTextActive: {
    fontWeight: '700',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
  },
  addIcon: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: '#999',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  roleButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
