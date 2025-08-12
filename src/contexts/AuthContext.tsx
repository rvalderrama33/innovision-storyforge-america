
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, AuthChangeEvent } from '@supabase/supabase-js';
import { validateEmail } from '@/lib/inputValidation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSubscriber: boolean;
  isAdmin: boolean;
  isVendor: boolean;
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
  const [isVendor, setIsVendor] = useState(false);

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
        return { isSubscriber: true, isAdmin: false, isVendor: false };
      }

      console.log('User roles data:', data);
      const roles = data?.map(r => r.role) || [];
      
      // Check for specific roles
      const hasSubscriberRole = roles.includes('subscriber');
      const hasAdminRole = roles.includes('admin');
      const hasVendorRole = roles.includes('vendor');
      
      // For authenticated users, if they have no roles or only subscriber role, treat as subscriber
      // If they have admin role, they're also a subscriber (admins can read articles)
      const result = {
        isSubscriber: hasSubscriberRole || hasAdminRole || roles.length === 0, // Default to subscriber for authenticated users
        isAdmin: hasAdminRole,
        isVendor: hasVendorRole
      };
      
      console.log('User role result for', userId, ':', result);
      return result;
    } catch (error) {
      console.error('Error in checkUserRole:', error);
      // On error, treat authenticated users as subscribers
      return { isSubscriber: true, isAdmin: false, isVendor: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validate email format for security
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { error: { message: emailValidation.error } };
      }

      // Check for account lockout before attempting sign in
      const { data: lockoutData, error: lockoutError } = await supabase.rpc('handle_failed_login', {
        _email: email.toLowerCase().trim()
      });

      if (lockoutError) {
        console.error('Lockout check error:', lockoutError);
      }

      if (lockoutData === false) {
        return { error: { message: 'Account temporarily locked due to multiple failed login attempts. Please try again in 30 minutes.' } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Handle failed login attempt
        await supabase.rpc('handle_failed_login', {
          _email: email.toLowerCase().trim()
        });
        return { error };
      }

      if (data.user) {
        // Reset login attempts on successful login
        await supabase.rpc('reset_login_attempts', {
          _email: email.toLowerCase().trim()
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Validate inputs for security
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { error: { message: emailValidation.error } };
      }

      if (password.length < 8) {
        return { error: { message: 'Password must be at least 8 characters long' } };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear all auth-related localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear submission wizard data for current user
      const currentUserId = user?.id;
      if (currentUserId) {
        localStorage.removeItem(`submission_wizard_data_${currentUserId}`);
        localStorage.removeItem(`submission_wizard_step_${currentUserId}`);
      }
      // Also clear anonymous data to be extra safe
      localStorage.removeItem('submission_wizard_data_anonymous');
      localStorage.removeItem('submission_wizard_step_anonymous');
      
      // Global sign out to invalidate all sessions
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force reload even if sign out fails
      window.location.href = '/';
    }
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
      if (session?.user) {
        setUser(session.user);
        setLoading(true); // Keep loading while we check roles
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('Auth event:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          setLoading(true); // Keep loading while we check roles
          console.log('User signed in:', session.user.email);
        } else {
          setUser(null);
          setIsSubscriber(false);
          setIsAdmin(false);
          setIsVendor(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check user role when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, checking roles for:', user.email, 'ID:', user.id);
      checkUserRole(user.id).then(({ isSubscriber: sub, isAdmin: admin, isVendor: vendor }) => {
        console.log('Setting subscriber status:', sub, 'admin status:', admin, 'vendor status:', vendor, 'for user:', user.email);
        setIsSubscriber(sub);
        setIsAdmin(admin);
        setIsVendor(vendor);
        setLoading(false); // Done loading after roles are set
      }).catch((error) => {
        console.error('Error checking user roles:', error);
        setLoading(false); // Set loading false even on error
      });
    } else {
      console.log('No user, clearing roles');
      setIsSubscriber(false);
      setIsAdmin(false);
      setIsVendor(false);
      setLoading(false);
    }
  }, [user]);

  const value = {
    user,
    loading,
    isSubscriber,
    isAdmin,
    isVendor,
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
