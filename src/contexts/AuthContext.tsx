
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSubscriber: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking user role:', error);
        return { isSubscriber: false, isAdmin: false };
      }

      const roles = data?.map(r => r.role) || [];
      return {
        isSubscriber: roles.includes('subscriber'),
        isAdmin: roles.includes('admin')
      };
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      return { isSubscriber: false, isAdmin: false };
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('Auth event:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_UP' && session?.user) {
          console.log('New user signed up:', session.user.email);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check user role when user changes
  useEffect(() => {
    if (user) {
      checkUserRole(user.id).then(({ isSubscriber: sub, isAdmin: admin }) => {
        setIsSubscriber(sub);
        setIsAdmin(admin);
      });
    } else {
      setIsSubscriber(false);
      setIsAdmin(false);
    }
  }, [user]);

  const value = {
    user,
    loading,
    isSubscriber,
    isAdmin
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
