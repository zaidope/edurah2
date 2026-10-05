'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import QuizMakerComponent from '@/components/quizMaker/QuizMakerComponent';

export default function TeacherQuizMakerPage() {
  const { profile } = useAuth();
  const teacherGradeId = profile?.gradeId;

  return (
    <div className="py-2">
      <QuizMakerComponent
        allowedGradeId={teacherGradeId}
        role="teacher"
      />
    </div>
  );
}
