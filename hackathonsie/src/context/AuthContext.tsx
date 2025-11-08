/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 */

import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Ensure user profile exists in the database
 */
async function ensureUserProfile(user: User | null) {
  if (!user) return;

  try {
    // Check if profile exists
    const existingProfile = await UserService.getUserProfile(user.id);

    if (!existingProfile) {
      // Create profile if it doesn't exist
      console.log('[AuthContext] Creating profile for user:', user.email);
      await UserService.createUserProfile(user.id, user.email || 'Unknown', '');
    }
  } catch (error) {
    console.error('[AuthContext] Error ensuring user profile:', error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    AuthService.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      ensureUserProfile(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      ensureUserProfile(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const session = await AuthService.signIn(email, password);
    setSession(session);
    setUser(session.user);
    await ensureUserProfile(session.user);
  };

  const signUp = async (email: string, password: string) => {
    const user = await AuthService.signUp(email, password);
    setUser(user);
    await ensureUserProfile(user);
  };

  const signOut = async () => {
    await AuthService.signOut();
    setSession(null);
    setUser(null);
  };

  const verifyOtp = async (email: string, token: string) => {
    const session = await AuthService.verifyOtp(email, token);
    setSession(session);
    setUser(session.user);
    await ensureUserProfile(session.user);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
