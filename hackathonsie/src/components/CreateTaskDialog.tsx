/**
 * Create Task Dialog Component
 * Modal for creating new tasks with group assignment
 */

import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useGroups } from '../hooks/useGroups';
import { TaskPriority } from '../types/database.types';

interface CreateTaskDialogProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (task: {
        title: string;
        description: string;
        priority: TaskPriority;
        due_date: string | null;
        group_id: string | null;
    }) => Promise<void>;
}

export default function CreateTaskDialog({
    visible,
    onClose,
    onCreate,
}: CreateTaskDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { groups } = useGroups();

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        try {
            setLoading(true);
            await onCreate({
                title: title.trim(),
                description: description.trim(),
                priority,
                due_date: dueDate || null,
                group_id: selectedGroupId,
            });

            // Reset form
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
            setSelectedGroupId(null);
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>New Task</Text>
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={loading || !title.trim()}
                    >
                        <Text
                            style={[
                                styles.createButton,
                                loading || !title.trim() ? styles.disabledButton : null,
                            ]}
                        >
                            Create
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    {/* Title */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter task title"
                            value={title}
                            onChangeText={setTitle}
                            editable={!loading}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter task description"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            editable={!loading}
                        />
                    </View>

                    {/* Priority */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Priority</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={priority}
                                onValueChange={(value: any) => setPriority(value as TaskPriority)}
                                enabled={!loading}
                            >
                                <Picker.Item label="Low" value="low" />
                                <Picker.Item label="Medium" value="medium" />
                                <Picker.Item label="High" value="high" />
                                <Picker.Item label="Urgent" value="urgent" />
                            </Picker>
                        </View>
                    </View>

                    {/* Due Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="2025-12-31"
                            value={dueDate}
                            onChangeText={setDueDate}
                            editable={!loading}
                        />
                    </View>

                    {/* Group Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Assign to Group</Text>
                        {groups.length > 0 ? (
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedGroupId}
                                    onValueChange={(value: any) => setSelectedGroupId(value)}
                                    enabled={!loading}
                                >
                                    <Picker.Item label="No group" value={null} />
                                    {groups.map((group) => (
                                        <Picker.Item
                                            key={group.id}
                                            label={group.name}
                                            value={group.id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>No groups available</Text>
                        )}
                    </View>
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                )}
            </ScrollView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 16,
        paddingTop: 60,
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    cancelButton: {
        color: '#666',
        fontSize: 16,
    },
    createButton: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.5,
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
        padding: 12,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
});
