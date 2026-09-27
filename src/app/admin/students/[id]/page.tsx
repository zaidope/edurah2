'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthService } from '@/lib/auth';
import { UserProfile } from '@/types';
import StudentDetailView from '@/components/students/StudentDetailView';

export default function AdminStudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudent() {
      setLoading(true);
      const found = await AuthService.getStudentById(studentId);
      if (found) {
        setStudent(found);
      }
      setLoading(false);
    }
    loadStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#d8a471] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#171819]">Student Profile Not Found</h2>
        <Link href="/admin/students" className="text-xs text-[#8e5a2b] font-bold hover:underline">
          Return to Students Directory
        </Link>
      </div>
    );
  }

  return (
    <StudentDetailView
      student={student}
      role="admin"
      backHref="/admin/students"
      onStudentUpdated={(updated) => setStudent(updated)}
    />
  );
}
