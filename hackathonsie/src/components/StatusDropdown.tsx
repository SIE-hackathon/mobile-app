/**
 * Status Dropdown Component
 * Dropdown menu for changing task status
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { TaskStatus } from '../types/database.types';
import { STATUS_COLORS } from '../constants';

interface StatusDropdownProps {
  currentStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

export default function StatusDropdown({ currentStatus, onStatusChange }: StatusDropdownProps) {
  const [visible, setVisible] = useState(false);

  const handleStatusSelect = (status: TaskStatus) => {
    setVisible(false);
    onStatusChange(status);
  };

  const currentOption = STATUS_OPTIONS.find(opt => opt.value === currentStatus);

  return (
    <View>
      <TouchableOpacity 
        onPress={() => setVisible(true)} 
        style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[currentStatus] }]}
      >
        <Text style={styles.statusText}>{currentOption?.label}</Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable 
          style={styles.overlay} 
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdown}>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  option.value === currentStatus && styles.selectedOption,
                ]}
                onPress={() => handleStatusSelect(option.value)}
              >
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[option.value] }]} />
                <Text style={[
                  styles.optionText,
                  option.value === currentStatus && styles.selectedText,
                ]}>
                  {option.label}
                </Text>
                {option.value === currentStatus && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dropdownIcon: {
    color: '#fff',
    fontSize: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 200,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  selectedOption: {
    backgroundColor: '#f5f5f5',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedText: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
