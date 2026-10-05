'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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

const AUTH_REQUEST_TIMEOUT_MS = 15000;
const PROFILE_REQUEST_TIMEOUT_MS = 10000;

function withTimeout<T>(operation: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([Promise.resolve(operation), timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}

function toProfile(record: Record<string, unknown>, userMeta?: Record<string, unknown>): UserProfile {
  return {
    id: String(record.id),
    fullName: String(record.full_name || userMeta?.full_name || ''),
    email: String(record.email || ''),
    studentId: String(record.student_id || ''),
    role: (record.role || 'student') as UserProfile['role'],
    gradeId: typeof record.grade_id === 'string' && record.grade_id ? record.grade_id : undefined,
    classGroup: typeof record.class_group === 'string' ? record.class_group : undefined,
    academicBatch: typeof record.academic_batch === 'string' ? record.academic_batch : undefined,
    isActive: Boolean(record.is_active ?? true),
    createdAt: String(record.created_at || ''),
    updatedAt: String(record.updated_at || ''),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRequests = useRef(new Map<string, Promise<UserProfile | null>>());

  const loadProfile = useCallback((userId: string, userMeta?: Record<string, unknown>) => {
    const existingRequest = profileRequests.current.get(userId);
    if (existingRequest) return existingRequest;

    const request = (async () => {
    const setFallbackProfile = () => {
      if (userMeta) {
        const fallbackProfile: UserProfile = {
          id: userId,
          fullName: String(userMeta.full_name || ''),
          email: '',
          studentId: '',
          role: 'student',
          gradeId: undefined,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
      setProfile(null);
      return null;
    };

    let data;
    let error;
    try {
      const result = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        PROFILE_REQUEST_TIMEOUT_MS,
        'Profile request timed out.',
      );
      data = result.data;
      error = result.error;
    } catch {
      return setFallbackProfile();
    }

    if (error || !data) {
      // Keep a restricted student shell when the authoritative profile is unavailable.
      return setFallbackProfile();
    }
    const nextProfile = toProfile(data, userMeta);
    setProfile(nextProfile.isActive ? nextProfile : null);

    return nextProfile;
    })();
    profileRequests.current.set(userId, request);
    return request.finally(() => {
      if (profileRequests.current.get(userId) === request) {
        profileRequests.current.delete(userId);
      }
    });
  }, []);

  const syncSession = useCallback(async (sessionUser: { id: string; email?: string; user_metadata: Record<string, unknown> } | null) => {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      if (active) void syncSession(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        AUTH_REQUEST_TIMEOUT_MS,
        'Sign-in timed out. Check your connection and try again.',
      );
      if (error || !data.user) {
        return { success: false, error: 'We couldn’t sign you in with those details. Please check your email and password.' };
      }
      const nextProfile = await loadProfile(data.user.id, data.user.user_metadata);
      setUser(data.user);
      if (!nextProfile) {
        await withTimeout(supabase.auth.signOut(), 5000, 'Sign-out timed out.').catch(() => undefined);
        setUser(null);
        return { success: false, error: 'Your account is not ready to use yet. Please contact your school administrator.' };
      }
      return { success: true, role: nextProfile.role };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to sign in. Please try again.',
      };
    } finally {
      setLoading(false);
    }
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
