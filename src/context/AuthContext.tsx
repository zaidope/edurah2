'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { AuthService } from '@/lib/auth';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile from Supabase profiles table
  const fetchProfileFromSupabase = async (userId: string, email: string): Promise<UserProfile | null> => {
    try {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && prof) {
        return {
          id: prof.id,
          fullName: prof.full_name,
          email: prof.email,
          studentId: prof.student_id || 'N/A',
          role: prof.role as 'admin' | 'student',
          classGroup: prof.class_group || 'General Batch',
          isActive: prof.is_active,
          createdAt: prof.created_at ? new Date(prof.created_at).toISOString().split('T')[0] : '',
          updatedAt: prof.updated_at ? new Date(prof.updated_at).toISOString().split('T')[0] : '',
        };
      }
    } catch (e) {
      console.warn('Could not fetch Supabase profile record:', e);
    }
    return null;
  };

  const syncUserSession = async (sessionUser: any) => {
    if (!sessionUser) {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('edurah_current_active_user');
      setLoading(false);
      return;
    }

    setUser(sessionUser);

    // Fetch real profile from Supabase
    const liveProfile = await fetchProfileFromSupabase(sessionUser.id, sessionUser.email || '');

    if (liveProfile) {
      setProfile(liveProfile);
      localStorage.setItem('edurah_current_active_user', JSON.stringify(liveProfile));
    } else {
      // If user exists in Auth but profile row is pending, construct temporary profile from metadata
      const meta = sessionUser.user_metadata || {};
      const fallbackProf: UserProfile = {
        id: sessionUser.id,
        fullName: meta.full_name || sessionUser.email?.split('@')[0] || 'Authenticated User',
        email: sessionUser.email || '',
        studentId: meta.student_id || 'EDU-2026-LIVE',
        role: (meta.role === 'admin' ? 'admin' : 'student'),
        classGroup: meta.class_group || 'Active Student',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setProfile(fallbackProf);
      localStorage.setItem('edurah_current_active_user', JSON.stringify(fallbackProf));
    }

    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            await syncUserSession(session.user);
          } else {
            // Check local fallback cached user if no Supabase session exists
            const savedUser = localStorage.getItem('edurah_current_active_user');
            if (savedUser) {
              try {
                const p = JSON.parse(savedUser);
                setProfile(p);
                setUser({ id: p.id, email: p.email });
              } catch (e) {}
            }
            setLoading(false);
          }
        }
      } catch (e) {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session?.user) {
          await syncUserSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('edurah_current_active_user');
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    // 1. Authenticate against Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const liveProfile = await fetchProfileFromSupabase(data.user.id, data.user.email || email);

        if (liveProfile) {
          if (!liveProfile.isActive) {
            await supabase.auth.signOut();
            setLoading(false);
            return { success: false, error: 'Your account has been deactivated. Please contact your administrator.' };
          }
          setUser(data.user);
          setProfile(liveProfile);
          localStorage.setItem('edurah_current_active_user', JSON.stringify(liveProfile));
          setLoading(false);
          return { success: true };
        } else {
          // If Auth user exists but profile row is missing, construct from user metadata
          const meta = data.user.user_metadata || {};
          const newProf: UserProfile = {
            id: data.user.id,
            fullName: meta.full_name || data.user.email?.split('@')[0] || 'Authenticated User',
            email: data.user.email || email,
            studentId: meta.student_id || 'EDU-2026-LIVE',
            role: (meta.role === 'admin' ? 'admin' : 'student'),
            classGroup: meta.class_group || 'Active Student',
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
          setUser(data.user);
          setProfile(newProf);
          localStorage.setItem('edurah_current_active_user', JSON.stringify(newProf));
          setLoading(false);
          return { success: true };
        }
      }
    } catch (e: any) {
      setLoading(false);
      return { success: false, error: e.message || 'Authentication error' };
    }

    setLoading(false);
    return { success: false, error: 'Invalid email or password credentials.' };
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setProfile(null);
    localStorage.removeItem('edurah_current_active_user');
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await fetchProfileFromSupabase(user.id, user.email || '');
      if (p) {
        setProfile(p);
        localStorage.setItem('edurah_current_active_user', JSON.stringify(p));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
