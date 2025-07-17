
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSubscriber: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserRole = async (userId: string) => {
    try {
      console.log('Checking user role for userId:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking user role:', error);
        // If there's an error checking roles, treat authenticated users as subscribers
        return { isSubscriber: true, isAdmin: false };
      }

      console.log('User roles data:', data);
      const roles = data?.map(r => r.role) || [];
      
      // If no roles found, treat authenticated users as subscribers by default
      const hasSubscriberRole = roles.includes('subscriber');
      const hasAdminRole = roles.includes('admin');
      
      const result = {
        isSubscriber: hasSubscriberRole || roles.length === 0, // Default to subscriber if no roles
        isAdmin: hasAdminRole
      };
      console.log('User role result:', result);
      return result;
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      // On error, treat authenticated users as subscribers
      return { isSubscriber: true, isAdmin: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('Auth event:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.email);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check user role when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, checking roles for:', user.email);
      checkUserRole(user.id).then(({ isSubscriber: sub, isAdmin: admin }) => {
        console.log('Setting subscriber status:', sub, 'admin status:', admin);
        setIsSubscriber(sub);
        setIsAdmin(admin);
      });
    } else {
      console.log('No user, clearing roles');
      setIsSubscriber(false);
      setIsAdmin(false);
    }
  }, [user]);

  const value = {
    user,
    loading,
    isSubscriber,
    isAdmin,
    signIn,
    signUp,
    signOut,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
