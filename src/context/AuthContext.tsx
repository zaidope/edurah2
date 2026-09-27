'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
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

function toProfile(record: Record<string, unknown>, userMeta?: Record<string, unknown>): UserProfile {
  const resolvedGradeId =
    typeof record.grade_id === 'string' && record.grade_id
      ? record.grade_id
      : typeof userMeta?.grade_id === 'string' && userMeta.grade_id.startsWith('grade-')
      ? userMeta.grade_id
      : record.role === 'student'
      ? 'grade-1'
      : undefined;

  return {
    id: String(record.id),
    fullName: String(record.full_name || userMeta?.full_name || ''),
    email: String(record.email || ''),
    studentId: String(record.student_id || userMeta?.student_id || ''),
    role: (record.role || userMeta?.role) as UserProfile['role'],
    gradeId: resolvedGradeId,
    classGroup: typeof record.class_group === 'string' ? record.class_group : undefined,
    academicBatch: typeof record.academic_batch === 'string' ? record.academic_batch : (typeof userMeta?.academic_batch === 'string' ? userMeta.academic_batch : '2025–2026'),
    isActive: Boolean(record.is_active ?? true),
    createdAt: String(record.created_at || ''),
    updatedAt: String(record.updated_at || ''),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string, userMeta?: Record<string, unknown>) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !data) {
      // If profile row doesn't exist yet, construct from user metadata if available
      if (userMeta) {
        const fallbackProfile: UserProfile = {
          id: userId,
          fullName: String(userMeta.full_name || ''),
          email: '',
          studentId: String(userMeta.student_id || ''),
          role: (userMeta.role as UserProfile['role']) || 'student',
          gradeId: typeof userMeta.grade_id === 'string' ? userMeta.grade_id : 'grade-1',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
      setProfile(null);
      return null;
    }
    const nextProfile = toProfile(data, userMeta);
    setProfile(nextProfile.isActive ? nextProfile : null);

    // Auto-heal grade_id in profiles table if null but available in metadata
    if (userMeta?.grade_id && typeof userMeta.grade_id === 'string' && !data.grade_id) {
      void supabase.from('profiles').update({ grade_id: userMeta.grade_id }).eq('id', userId);
    }

    return nextProfile;
  }, []);

  const syncSession = useCallback(async (sessionUser: any | null) => {
    if (!sessionUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setUser(sessionUser);
    await loadProfile(sessionUser.id, sessionUser.user_metadata);
    setLoading(false);
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void syncSession(data.session?.user ?? null);
    }).catch(() => {
      if (active) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) void syncSession(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      setLoading(false);
      return { success: false, error: 'We couldn’t sign you in with those details. Please check your email and password.' };
    }
    const nextProfile = await loadProfile(data.user.id, data.user.user_metadata);
    setUser(data.user);
    setLoading(false);
    if (!nextProfile) {
      await supabase.auth.signOut();
      setUser(null);
      return { success: false, error: 'Your account is not ready to use yet. Please contact your school administrator.' };
    }
    return { success: true, role: nextProfile.role };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
