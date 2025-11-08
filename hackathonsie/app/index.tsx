/**
 * Index/Landing Page
 * Entry point - shows landing page or redirects based on auth state
 */

import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import LandingScreen from '../src/screens/LandingScreen';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  // React to session changes
  useEffect(() => {
    if (!loading && session) {
      router.replace('/(tabs)/dashboard' as any);
    }
  }, [session, loading]);

  // Show nothing while checking auth state
  if (loading) {
    return null;
  }

  // If authenticated, redirect to tasks
  if (session) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  // Show landing page if not authenticated
  return <LandingScreen />;
}
