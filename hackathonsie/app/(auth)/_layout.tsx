/**
 * Auth Routes Layout
 * Stack navigator for authentication screens (login, register)
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Log In',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Create Account',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
