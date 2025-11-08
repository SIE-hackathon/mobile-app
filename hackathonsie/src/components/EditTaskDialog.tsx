/**
 * Edit Task Dialog
 * Modal for editing task details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Task, TaskPriority } from '../types/database.types';

interface EditTaskDialogProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => Promise<void>;
}

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#991B1B',
};

export default function EditTaskDialog({ visible, task, onClose, onSave }: EditTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [progress, setProgress] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setProgress(task.progress.toString());
      setDueDate(task.due_date || '');
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      const updates: Partial<Task> = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        progress: parseInt(progress) || 0,
        due_date: dueDate || undefined,
      };

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
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
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                placeholderTextColor="#999"
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter task description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Priority */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {PRIORITY_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      priority === p && styles.priorityOptionActive,
                      { borderColor: PRIORITY_COLORS[p] },
                      priority === p && { backgroundColor: PRIORITY_COLORS[p] },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        priority === p && styles.priorityTextActive,
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Progress */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Progress (%)</Text>
              <TextInput
                style={styles.input}
                value={progress}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  setProgress(Math.min(100, Math.max(0, num)).toString());
                }}
                placeholder="0-100"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            {/* Due Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
              <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2025-12-31)</Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving || !title.trim()}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
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
    maxHeight: '85%',
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
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityOption: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityOptionActive: {
    borderWidth: 2,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  priorityTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
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
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
