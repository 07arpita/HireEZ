'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, company: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

// Mock user for development
const mockUser: User = {
  id: 'mock-user-id',
  email: 'user@example.com',
  created_at: new Date().toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
  user_metadata: {
    full_name: 'Mock User',
    company: 'Demo Company'
  },
  app_metadata: {},
  identities: []
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock auth token immediately
    const authToken = Cookies.get('auth-token');
    if (authToken === 'mock-auth-token') {
      setUser(mockUser);
      setLoading(false);
      return;
    }

    // If no mock token, check Supabase
    if (!supabase) {
      console.warn('Supabase not configured - running in demo mode');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        } else if (isMounted) {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          console.log('Auth state changed:', event);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove mounted dependency

  const signIn = async (email: string, password: string) => {
    // Check for mock credentials
    if (email === 'user@example.com' && password === 'password123') {
      Cookies.set('auth-token', 'mock-auth-token', { expires: 7 });
      setUser(mockUser);
      return { error: null };
    }

    if (!supabase) {
      return { error: { message: 'Supabase not configured. Please check your environment variables.' } };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'Failed to sign in. Please try again.' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, company: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured. Please check your environment variables.' } };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company: company,
          }
        }
      });

      if (!error && data.user) {
        console.log('User signed up successfully:', data.user.id);
      }

      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: { message: 'Failed to create account. Please try again.' } };
    }
  };

  const signOut = async () => {
    // Clear mock auth token
    Cookies.remove('auth-token');
    setUser(null);

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  };

  // If still loading, show nothing
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};