/**
 * Groups Display Component
 * Shows user's groups with member count
 */

import React, { useState } from 'react';
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
import { useGroups } from '../hooks/useGroups';
import { supabase } from '../services/supabase';
import { Group, GroupMember } from '../types/database.types';

export default function GroupsDisplay() {
    const { groups, loading, fetchGroups } = useGroups();
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const handleSelectGroup = async (group: Group) => {
        setSelectedGroup(group);
        await loadMembers(group.id);
    };

    const loadMembers = async (groupId: string) => {
        setLoadingMembers(true);
        try {
            const { data, error } = await supabase
                .from('group_members')
                .select('*')
                .eq('group_id', groupId);

            if (error) throw error;
            setMembers(data || []);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to load group members');
            console.error(error);
        } finally {
            setLoadingMembers(false);
        }
    }; const renderGroup = ({ item }: { item: Group }) => (
        <TouchableOpacity
            style={styles.groupCard}
            onPress={() => handleSelectGroup(item)}
        >
            <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupDesc} numberOfLines={1}>
                    {item.description || 'No description'}
                </Text>
            </View>
            <View style={styles.memberBadge}>
                <Text style={styles.memberCount}>👥</Text>
            </View>
        </TouchableOpacity>
    );

    const renderMember = ({ item }: { item: GroupMember }) => (
        <View style={styles.memberItem}>
            <View style={styles.memberAvatar}>
                <Text style={styles.avatarText}>
                    {item.user_id.substring(0, 1).toUpperCase() || '?'}
                </Text>
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberEmail}>{item.user_id}</Text>
                <Text style={styles.memberRole}>{item.role}</Text>
            </View>
        </View>
    ); if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Groups</Text>
                    <Text style={styles.count}>{groups.length}</Text>
                </View>

                {groups.length > 0 ? (
                    <FlatList
                        data={groups}
                        renderItem={renderGroup}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No groups yet</Text>
                        <Text style={styles.emptySubtext}>
                            Join or create a group to get started
                        </Text>
                    </View>
                )}
            </View>

            {/* Members Modal */}
            <Modal
                visible={selectedGroup !== null}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setSelectedGroup(null)}
            >
                <ScrollView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                            <Text style={styles.closeButton}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{selectedGroup?.name}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {selectedGroup?.description && (
                        <View style={styles.descriptionBox}>
                            <Text style={styles.descriptionText}>
                                {selectedGroup.description}
                            </Text>
                        </View>
                    )}

                    <View style={styles.membersHeader}>
                        <Text style={styles.membersTitle}>Members ({members.length})</Text>
                    </View>

                    {loadingMembers ? (
                        <ActivityIndicator
                            size="large"
                            color="#007AFF"
                            style={styles.loadingMembers}
                        />
                    ) : members.length > 0 ? (
                        <FlatList
                            data={members}
                            renderItem={renderMember}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            contentContainerStyle={styles.membersList}
                        />
                    ) : (
                        <View style={styles.emptyMembers}>
                            <Text style={styles.emptyText}>No members</Text>
                        </View>
                    )}
                </ScrollView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    centerContainer: {
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        height: 200,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    count: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        backgroundColor: '#E8F4FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    listContainer: {
        paddingHorizontal: 16,
        gap: 12,
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
        gap: 4,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    groupDesc: {
        fontSize: 13,
        color: '#666',
    },
    memberBadge: {
        marginLeft: 12,
    },
    memberCount: {
        fontSize: 20,
    },
    emptyContainer: {
        paddingHorizontal: 16,
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
    },
    // Modal styles
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
        marginTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    closeButton: {
        color: '#007AFF',
        fontSize: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    descriptionBox: {
        margin: 16,
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    membersHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    membersTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    loadingMembers: {
        marginVertical: 24,
    },
    membersList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    memberInfo: {
        flex: 1,
    },
    memberEmail: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
    },
    memberRole: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    emptyMembers: {
        paddingVertical: 32,
        alignItems: 'center',
    },
});
