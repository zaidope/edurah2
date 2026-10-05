'use client';

import { useEffect, useState } from 'react';
import EdurahExperience from '@/components/landing/EdurahExperience';
import { ContentService } from '@/lib/content';
import PageTransition from '@/components/layout/PageTransition';

export default function HomePage() {
  const [catalogCounts, setCatalogCounts] = useState({ courses: 0, quizzes: 0 });
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([
      ContentService.loadCourses(undefined, 'published'),
      ContentService.loadQuizzes(undefined, undefined, 'published'),
    ]).then(([courses, quizzes]) => {
      if (active) setCatalogCounts({ courses: courses.length, quizzes: quizzes.length });
    }).catch(() => {
      if (active) setLoadError('Live curriculum totals are temporarily unavailable.');
    });
    return () => { active = false; };
  }, []);

  return (
    <PageTransition>
      {loadError && <p role="status" className="sr-only">{loadError}</p>}
      <EdurahExperience courseCount={catalogCounts.courses} quizCount={catalogCounts.quizzes} />
    </PageTransition>
  );
}
