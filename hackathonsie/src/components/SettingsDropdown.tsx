/**
 * Settings Dropdown Component
 * Shows menu with User Profile, Theme Settings, and Logout
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';

interface SettingsDropdownProps {
  onProfilePress: () => void;
  onThemePress: () => void;
  onLogoutPress: () => void;
}

export default function SettingsDropdown({ 
  onProfilePress, 
  onThemePress, 
  onLogoutPress 
}: SettingsDropdownProps) {
  const [visible, setVisible] = useState(false);

  const handleOptionPress = (callback: () => void) => {
    setVisible(false);
    callback();
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={() => setVisible(!visible)} 
        style={styles.settingsButton}
        activeOpacity={0.6}
      >
        <Text style={styles.settingsIcon}>⚙</Text>
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
            <TouchableOpacity 
              style={styles.option}
              onPress={() => handleOptionPress(onProfilePress)}
            >
              <Text style={styles.optionIcon}>👤</Text>
              <Text style={styles.optionText}>User Profile</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.option}
              onPress={() => handleOptionPress(onThemePress)}
            >
              <Text style={styles.optionIcon}>🎨</Text>
              <Text style={styles.optionText}>Theme Settings</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.option}
              onPress={() => handleOptionPress(onLogoutPress)}
            >
              <Text style={[styles.optionIcon, styles.dangerIcon]}>⎋</Text>
              <Text style={[styles.optionText, styles.dangerText]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
    color: '#333',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
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
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dangerIcon: {
    color: '#FF3B30',
  },
  dangerText: {
    color: '#FF3B30',
  },
});
