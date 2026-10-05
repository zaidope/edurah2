import { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase/client';

type ProvisionInput = {
  fullName: string;
  email: string;
  studentId?: string;
  gradeId: string;
  classGroup?: string;
  academicBatch?: string;
  password: string;
  department?: string;
};

function mapProfile(record: Record<string, unknown>): UserProfile {
  return {
    id: String(record.id),
    fullName: String(record.full_name || ''),
    email: String(record.email || ''),
    studentId: String(record.student_id || ''),
    role: record.role as UserProfile['role'],
    gradeId: typeof record.grade_id === 'string' ? record.grade_id : undefined,
    classGroup: typeof record.class_group === 'string' ? record.class_group : undefined,
    academicBatch: typeof record.academic_batch === 'string' ? record.academic_batch : undefined,
    isActive: Boolean(record.is_active),
    createdAt: String(record.created_at || ''),
    updatedAt: String(record.updated_at || ''),
  };
}

async function getProfiles(role: 'student' | 'teacher') {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', role).order('full_name');
  if (error) return [];
  return (data || []).map(mapProfile);
}

async function updateProfile(id: string, values: Record<string, unknown>) {
  const { error } = await supabase.from('profiles').update(values).eq('id', id);
  return !error;
}

async function provision(endpoint: string, input: ProvisionInput) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { success: false, error: 'Your session has ended. Please sign in again.' };
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(input),
    });
    const result = await response.json();
    return response.ok ? { success: true } : { success: false, error: result.error || 'We couldn’t create that account.' };
  } catch {
    return { success: false, error: 'We couldn’t reach the account service. Please try again.' };
  }
}

export const AuthService = {
  getStudents: () => getProfiles('student'),
  getTeachers: () => getProfiles('teacher'),
  async getStudentById(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).eq('role', 'student').maybeSingle();
    return data ? mapProfile(data) : undefined;
  },
  async getTeacherById(id: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).eq('role', 'teacher').maybeSingle();
    return data ? mapProfile(data) : undefined;
  },
  async getStudentsByGrade(gradeId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch(`/api/teacher/students?gradeId=${encodeURIComponent(gradeId)}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.students)) {
            return json.students.map(mapProfile);
          }
        }
      }
    } catch {
      // Fall through to client direct query
    }

    const students = await getProfiles('student');
    return students.filter((s) => s.gradeId === gradeId);
  },
  async searchStudents(query = '', status: 'all' | 'active' | 'inactive' = 'all', gradeId = 'all', batch = 'all') {
    let students = await getProfiles('student');
    const term = query.trim().toLowerCase();
    if (term) students = students.filter((student) => [student.fullName, student.email, student.studentId].some((value) => value.toLowerCase().includes(term)));
    if (status !== 'all') students = students.filter((student) => student.isActive === (status === 'active'));
    if (gradeId !== 'all') students = students.filter((student) => student.gradeId === gradeId);
    if (batch !== 'all') students = students.filter((student) => (student.academicBatch || '2025–2026') === batch);
    return students;
  },
  async searchTeachers(query = '', status: 'all' | 'active' | 'inactive' = 'all', gradeId = 'all') {
    let teachers = await getProfiles('teacher');
    const term = query.trim().toLowerCase();
    if (term) teachers = teachers.filter((teacher) => [teacher.fullName, teacher.email, teacher.studentId].some((value) => value.toLowerCase().includes(term)));
    if (status !== 'all') teachers = teachers.filter((teacher) => teacher.isActive === (status === 'active'));
    if (gradeId !== 'all') teachers = teachers.filter((teacher) => teacher.gradeId === gradeId);
    return teachers;
  },
  updateStudentGrade: (id: string, gradeId: string) => updateProfile(id, { grade_id: gradeId }),
  updateStudentBatch: (id: string, batch: string) => updateProfile(id, { academic_batch: batch }),
  updateStudentGradeAndBatch: (id: string, gradeId: string, batch: string) => updateProfile(id, { grade_id: gradeId, academic_batch: batch }),
  updateTeacherGrade: (id: string, gradeId: string) => updateProfile(id, { grade_id: gradeId }),
  async toggleStudentStatus(id: string) {
    const student = await this.getStudentById(id);
    return student ? updateProfile(id, { is_active: !student.isActive }) : false;
  },
  async toggleTeacherStatus(id: string) {
    const teacher = await this.getTeacherById(id);
    return teacher ? updateProfile(id, { is_active: !teacher.isActive }) : false;
  },
  provisionStudent: (input: ProvisionInput) => provision('/api/admin/provision-student', input),
  provisionTeacher: (input: ProvisionInput) => provision('/api/admin/provision-teacher', input),
};
