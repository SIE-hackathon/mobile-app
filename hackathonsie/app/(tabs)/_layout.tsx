/**
 * Protected Routes Layout
 * Tab navigator for authenticated screens
 */

import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function TabsLayout() {
  const { session, loading } = useAuth();

  // Wait for auth check
  if (loading) {
    return null;
  }

  // Redirect to landing if not authenticated
  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="tasks" 
        options={{ 
          title: 'Tasks',
          tabBarIcon: () => <Text>📋</Text>,
        }} 
      />
      <Tabs.Screen 
        name="kanban" 
        options={{ 
          title: 'Kanban',
          tabBarIcon: () => <Text>📊</Text>,
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: () => <Text>👤</Text>,
        }} 
      />
    </Tabs>
  );
}
