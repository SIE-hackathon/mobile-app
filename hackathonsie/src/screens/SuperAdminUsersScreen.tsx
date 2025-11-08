/**
 * Super Admin Users Screen
 * Allows super admins to view verified users and assign managers to groups
 */

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/auth.service';
import { supabase } from '../services/supabase';

interface VerifiedUser {
    id: string;
    email: string;
    email_verified_at?: string;
}

interface Group {
    id: string;
    name: string;
    manager?: string;
    manager_email?: string;
}

export default function SuperAdminUsersScreen() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<VerifiedUser[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [managerModalVisible, setManagerModalVisible] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [unauthorized, setUnauthorized] = useState(false);

    useEffect(() => {
        checkAdminStatus();
    }, [currentUser]);

    const checkAdminStatus = async () => {
        try {
            if (!currentUser) {
                setUnauthorized(true);
                setLoading(false);
                return;
            }

            const isAdmin = AuthService.isSuperAdmin(currentUser);
            if (!isAdmin) {
                setUnauthorized(true);
                setLoading(false);
                return;
            }

            setIsSuperAdmin(true);
            await Promise.all([fetchVerifiedUsers(), fetchGroups()]);
        } catch (error) {
            console.error('Error checking admin status:', error);
            setUnauthorized(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchVerifiedUsers = async () => {
        try {
            // Try to get verified users via RPC function (if available)
            let verifiedUsers: VerifiedUser[] = [];

            try {
                const { data: users, error: usersError } = await supabase.rpc('get_verified_users');

                if (!usersError && users) {
                    verifiedUsers = users.map((u: any) => ({
                        id: u.id || u.user_id,
                        email: u.email,
                        email_verified_at: u.email_verified_at,
                    }));
                }
            } catch (rpcError) {
                console.warn('RPC function get_verified_users not available');
            }

            // Fallback: Get users from group_members table
            if (verifiedUsers.length === 0) {
                const { data: members, error: membersError } = await supabase
                    .from('group_members')
                    .select('user_id');

                if (!membersError && members) {
                    // Get unique user IDs
                    const uniqueUserIds = [...new Set(members.map(m => m.user_id) || [])];
                    verifiedUsers = uniqueUserIds.map(id => ({
                        id,
                        email: 'User email not available',
                        email_verified_at: new Date().toISOString(),
                    }));
                }
            }

            setUsers(verifiedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert(
                'Setup Required',
                'To view verified users, you need to either:\n1. Create a get_verified_users() RPC function in Supabase\n2. Or create a public profiles table with user emails'
            );
        }
    };

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch manager emails
            const groupsWithManagerEmails = await Promise.all(
                (data || []).map(async (group) => {
                    if (group.manager) {
                        const { data: managerData } = await supabase.auth.admin.getUserById(group.manager);
                        return {
                            ...group,
                            manager_email: managerData?.user?.email,
                        };
                    }
                    return group;
                })
            );

            setGroups(groupsWithManagerEmails);
        } catch (error) {
            console.error('Error fetching groups:', error);
            Alert.alert('Error', 'Failed to load groups');
        }
    };

    const handleAssignManager = async (groupId: string, userId: string) => {
        try {
            const { error } = await supabase
                .from('groups')
                .update({ manager: userId })
                .eq('id', groupId);

            if (error) throw error;

            Alert.alert('Success', 'Manager assigned successfully');
            setManagerModalVisible(false);
            fetchGroups();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to assign manager');
        }
    };

    const renderUserItem = ({ item }: { item: VerifiedUser }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => {
                if (selectedGroup) {
                    handleAssignManager(selectedGroup.id, item.id);
                }
            }}
        >
            <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{item.email.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.verifiedBadge}>✓ Verified</Text>
            </View>
        </TouchableOpacity>
    );

    const renderGroupItem = ({ item }: { item: Group }) => (
        <TouchableOpacity
            style={styles.groupCard}
            onPress={() => {
                setSelectedGroup(item);
                setManagerModalVisible(true);
            }}
        >
            <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                {item.manager_email ? (
                    <Text style={styles.managerEmail}>Manager: {item.manager_email}</Text>
                ) : (
                    <Text style={styles.noManagerText}>No manager assigned</Text>
                )}
            </View>
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                    setSelectedGroup(item);
                    setManagerModalVisible(true);
                }}
            >
                <Text style={styles.editButtonText}>Assign Manager</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (unauthorized) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.unauthorizedTitle}>Access Denied</Text>
                <Text style={styles.unauthorizedText}>
                    Only super admins can access this screen.
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Verified Users ({users.length})</Text>
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContainer}
                />
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Groups ({groups.length})</Text>
                <FlatList
                    data={groups}
                    renderItem={renderGroupItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContainer}
                />
            </View>

            {/* Manager Selection Modal */}
            <Modal
                visible={managerModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setManagerModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setManagerModalVisible(false)}>
                            <Text style={styles.closeButton}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            Select Manager for {selectedGroup?.name}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <FlatList
                        data={users}
                        renderItem={renderUserItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.modalList}
                    />
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
        color: '#000',
    },
    listContainer: {
        gap: 12,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    verifiedBadge: {
        fontSize: 12,
        color: '#10B981',
        marginTop: 4,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    managerEmail: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    noManagerText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    editButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 12,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 16,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginTop: 12,
    },
    closeButton: {
        color: '#007AFF',
        fontSize: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    modalList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    unauthorizedTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    unauthorizedText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});
