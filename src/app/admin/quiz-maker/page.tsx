'use client';

import React from 'react';
import QuizMakerComponent from '@/components/quizMaker/QuizMakerComponent';

export default function AdminQuizMakerPage() {
  return (
    <div className="py-2">
      <QuizMakerComponent role="admin" />
    </div>
  );
}
