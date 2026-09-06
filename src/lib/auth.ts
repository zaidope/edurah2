import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase/client';

const DEMO_STUDENTS_KEY = 'edurah_demo_students_list';

const INITIAL_DEMO_STUDENTS: UserProfile[] = [
  {
    id: 'usr-student-1',
    fullName: 'Alex Mercer',
    email: 'alex.mercer@edurah.edu',
    studentId: 'EDU-2026-001',
    role: 'student',
    classGroup: 'Computer Science Batch A',
    isActive: true,
    createdAt: '2026-08-10',
    updatedAt: '2026-08-28'
  },
  {
    id: 'usr-student-2',
    fullName: 'Sophia Chen',
    email: 'sophia.chen@edurah.edu',
    studentId: 'EDU-2026-002',
    role: 'student',
    classGroup: 'AI & Data Science Cohort 3',
    isActive: true,
    createdAt: '2026-08-12',
    updatedAt: '2026-08-30'
  },
  {
    id: 'usr-student-3',
    fullName: 'Marcus Brody',
    email: 'marcus.brody@edurah.edu',
    studentId: 'EDU-2026-003',
    role: 'student',
    classGroup: 'Web Development Batch B',
    isActive: true,
    createdAt: '2026-08-15',
    updatedAt: '2026-08-31'
  }
];

class AuthServiceClass {
  // Get stored demo student accounts for offline/demo development
  getDemoStudents(): UserProfile[] {
    if (typeof window === 'undefined') return INITIAL_DEMO_STUDENTS;
    try {
      const data = localStorage.getItem(DEMO_STUDENTS_KEY);
      return data ? JSON.parse(data) : INITIAL_DEMO_STUDENTS;
    } catch {
      return INITIAL_DEMO_STUDENTS;
    }
  }

  saveDemoStudents(students: UserProfile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(DEMO_STUDENTS_KEY, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save demo students:', e);
    }
  }

  // Provision student account via server-side administrative API
  async provisionStudent(data: {
    fullName: string;
    email: string;
    studentId: string;
    classGroup?: string;
    password?: string;
  }): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      // 1. Get active session access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // 2. Call secure server-side administrative provisioning endpoint
      const response = await fetch('/api/admin/provision-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.profile) {
        // Save to local demo storage for instant UI responsiveness
        const current = this.getDemoStudents();
        current.unshift(result.profile);
        this.saveDemoStudents(current);
        return { success: true, profile: result.profile };
      }

      // Fallback for local demo environment if API returns an error
      const fallbackProfile: UserProfile = {
        id: `usr-student-${Date.now()}`,
        fullName: data.fullName,
        email: data.email,
        studentId: data.studentId,
        role: 'student',
        classGroup: data.classGroup || 'General Batch',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      const current = this.getDemoStudents();
      current.unshift(fallbackProfile);
      this.saveDemoStudents(current);

      return {
        success: true,
        profile: fallbackProfile,
        error: result.error ? `Server Provisioning Notice: ${result.error}` : undefined,
      };
    } catch (err: any) {
      // Fallback for offline demo mode
      const fallbackProfile: UserProfile = {
        id: `usr-student-${Date.now()}`,
        fullName: data.fullName,
        email: data.email,
        studentId: data.studentId,
        role: 'student',
        classGroup: data.classGroup || 'General Batch',
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      const current = this.getDemoStudents();
      current.unshift(fallbackProfile);
      this.saveDemoStudents(current);

      return { success: true, profile: fallbackProfile };
    }
  }

  // Fetch all student profiles from Supabase with fallback to local demo data
  async getStudents(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((prof: any) => ({
          id: prof.id,
          fullName: prof.full_name,
          email: prof.email,
          studentId: prof.student_id || 'N/A',
          role: prof.role as 'admin' | 'student',
          classGroup: prof.class_group || 'General Batch',
          isActive: prof.is_active,
          createdAt: prof.created_at ? new Date(prof.created_at).toISOString().split('T')[0] : '',
          updatedAt: prof.updated_at ? new Date(prof.updated_at).toISOString().split('T')[0] : '',
        }));
      }
    } catch (e) {
      console.warn('Supabase profile fetch error, falling back to local storage:', e);
    }
    return this.getDemoStudents();
  }

  // Search & Filter Students asynchronously
  async searchStudents(query: string, filterStatus: 'all' | 'active' | 'inactive'): Promise<UserProfile[]> {
    const allStudents = await this.getStudents();
    let list = allStudents;

    if (filterStatus === 'active') {
      list = list.filter(s => s.isActive);
    } else if (filterStatus === 'inactive') {
      list = list.filter(s => !s.isActive);
    }

    if (!query.trim()) return list;

    const q = query.toLowerCase().trim();
    return list.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      (s.classGroup && s.classGroup.toLowerCase().includes(q))
    );
  }

  // Update Student Status in Supabase & Local Cache
  async toggleStudentStatus(id: string): Promise<boolean> {
    const students = await this.getStudents();
    const target = students.find(s => s.id === id);
    if (target) {
      const newStatus = !target.isActive;
      target.isActive = newStatus;
      
      // Update local cache
      const demoStudents = this.getDemoStudents();
      const localTarget = demoStudents.find(s => s.id === id);
      if (localTarget) {
        localTarget.isActive = newStatus;
        this.saveDemoStudents(demoStudents);
      }

      // Update Supabase profiles table
      try {
        await supabase
          .from('profiles')
          .update({ is_active: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (e) {}
      
      return true;
    }
    return false;
  }

  // Get single student profile by ID
  async getStudentById(id: string): Promise<UserProfile | undefined> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          studentId: data.student_id || 'N/A',
          role: data.role as 'admin' | 'student',
          classGroup: data.class_group || 'General Batch',
          isActive: data.is_active,
          createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : '',
          updatedAt: data.updated_at ? new Date(data.updated_at).toISOString().split('T')[0] : '',
        };
      }
    } catch (e) {}

    return this.getDemoStudents().find(s => s.id === id);
  }
}

export const AuthService = new AuthServiceClass();
