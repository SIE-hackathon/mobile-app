/**
 * Edit Group Dialog
 * Modal dialog for editing existing groups
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Group } from '../types/database.types';

interface EditGroupDialogProps {
  visible: boolean;
  group: Group | null;
  onDismiss: () => void;
  onUpdate: (groupName: string, description: string) => void;
}

export default function EditGroupDialog({
  visible,
  group,
  onDismiss,
  onUpdate,
}: EditGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setDescription(group.description || '');
    }
  }, [group, visible]);

  const handleUpdate = () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    onUpdate(groupName.trim(), description.trim());
    setGroupName('');
    setDescription('');
  };

  const handleDismiss = () => {
    setGroupName('');
    setDescription('');
    onDismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleDismiss}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Group</Text>
          <TouchableOpacity onPress={handleUpdate}>
            <Text style={styles.updateButton}>Update</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Enter group description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#ccc"
            />
          </View>
        </View>
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
  cancelButton: {
    fontSize: 16,
    color: '#999',
  },
  updateButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
});
