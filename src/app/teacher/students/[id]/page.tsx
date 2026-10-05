'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/lib/auth';
import { UserProfile } from '@/types';
import StudentDetailView from '@/components/students/StudentDetailView';
import { ShieldAlert } from 'lucide-react';

export default function TeacherStudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const { profile, loading: authLoading } = useAuth();

  const [student, setStudent] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function loadStudent() {
      setLoading(true);
      const found = await AuthService.getStudentById(studentId);
      if (found) {
        setStudent(found);
      }
      setLoading(false);
    }
    loadStudent();
  }, [studentId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#d8a471] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#171819]">Student Not Found</h2>
        <Link href="/teacher/students" className="text-xs text-[#8e5a2b] font-bold hover:underline">
          Return to Cohort Roster
        </Link>
      </div>
    );
  }

  // Teacher grade isolation check
  const teacherGradeId = profile?.gradeId;
  if (profile?.role === 'teacher' && student.gradeId !== teacherGradeId) {
    return (
      <div className="edurah-card-warm max-w-xl mx-auto p-8 rounded-2xl border border-[#d8d0c2] text-center space-y-4 mt-8">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-serif-heading text-xl font-normal text-[#171819]">Access Restricted</h3>
        <p className="text-xs text-[#6f6b63] leading-relaxed">
          This student belongs to another grade cohort. Faculty members can only review learning records for students enrolled in their assigned grade.
        </p>
        <Link
          href="/teacher/students"
          className="inline-block px-4 py-2 bg-[#8e5a2b] text-white text-xs font-bold uppercase tracking-wider rounded-xl"
        >
          Return to My Cohort
        </Link>
      </div>
    );
  }

  return (
    <StudentDetailView
      student={student}
      role="teacher"
      backHref="/teacher/students"
      onStudentUpdated={(updated) => setStudent(updated)}
    />
  );
}
