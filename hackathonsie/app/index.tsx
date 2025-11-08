/**
 * Index/Landing Page
 * Entry point - shows landing page or redirects based on auth state
 */

import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import LandingScreen from '../src/screens/LandingScreen';

export default function Index() {
  const { session, loading } = useAuth();

  // Show nothing while checking auth state
  if (loading) {
    return null;
  }

  // If authenticated, redirect to tasks
  if (session) {
    return <Redirect href="/(tabs)/tasks" />;
  }

  // Show landing page if not authenticated
  return <LandingScreen />;
}
