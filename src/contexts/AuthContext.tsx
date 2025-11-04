import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setupAutoSync } from '@/lib/syncManager';

type UserRole = 'admin' | 'employee' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  isInitialized: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Set up auto-sync on mount
  useEffect(() => {
    setupAutoSync();
  }, []);

  // Fetch user role from user_roles table
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        // Error already handled by RLS - default to employee role
        return 'employee';
      }

      if (!data || data.length === 0) {
        return 'employee';
      }

      // If user has multiple roles, prefer admin role
      const roles = data.map(r => r.role);
      if (roles.includes('admin')) {
        return 'admin';
      }

      return roles[0] as UserRole || 'employee';
    } catch (error) {
      // Error already handled - default to employee role
      return 'employee';
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Fetch role after setting user
        if (currentSession?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const userRole = await fetchUserRole(currentSession.user.id);
            setRole(userRole);
            setLoading(false);
            setIsInitialized(true);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
          setIsInitialized(true);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const userRole = await fetchUserRole(currentSession.user.id);
        setRole(userRole);
      } else {
        setRole(null);
      }
      
      setLoading(false);
      setIsInitialized(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Účet vytvorený! Prosím, prihláste sa.');
      return { error: null };
    } catch (error: any) {
      toast.error('Chyba pri registrácii');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Nesprávne prihlasovacie údaje');
        return { error };
      }

      // Redirect only on explicit sign in
      if (data.user) {
        const userRole = await fetchUserRole(data.user.id);
        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }

      toast.success('Úspešne prihlásený!');
      return { error: null };
    } catch (error: any) {
      toast.error('Chyba pri prihlasovaní');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      toast.success('Odhlásený');
      navigate('/auth');
    } catch (error) {
      toast.error('Chyba pri odhlásení');
    }
  };

  const value = {
    user,
    session,
    role,
    loading,
    isInitialized,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
