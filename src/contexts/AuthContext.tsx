
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from '@/lib/emailService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSubscriber: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Send welcome email only for new signups by checking if user was created recently
        if (event === 'SIGNED_IN' && session?.user && !user) {
          const userCreatedAt = new Date(session.user.created_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
          // Only send welcome email if user was created in the last 5 minutes
          if (userCreatedAt > fiveMinutesAgo) {
            setTimeout(async () => {
              try {
                await sendWelcomeEmail(
                  session.user.email!, 
                  session.user.user_metadata?.full_name || session.user.email
                );
                console.log('Welcome email sent successfully');
              } catch (error) {
                console.error('Failed to send welcome email:', error);
              }
            }, 0);
          }
        }
        
        if (session?.user) {
          // Check if user is admin and subscriber
          setTimeout(async () => {
            try {
              const [adminData, subscriberData] = await Promise.all([
                supabase.rpc('has_role', {
                  _user_id: session.user.id,
                  _role: 'admin'
                }),
                supabase.rpc('has_role', {
                  _user_id: session.user.id,
                  _role: 'subscriber'
                })
              ]);
              const isUserAdmin = adminData.data || false;
              const isUserSubscriber = subscriberData.data || false;
              
              setIsAdmin(isUserAdmin);
              // Admins should also have subscriber privileges
              setIsSubscriber(isUserSubscriber || isUserAdmin);
            } catch (error) {
              console.error('Error checking user roles:', error);
              setIsAdmin(false);
              setIsSubscriber(false);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSubscriber(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const value = {
    user,
    session,
    isAdmin,
    isSubscriber,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
