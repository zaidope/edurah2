import EdurahExperience from '@/components/landing/EdurahExperience';
import { ContentService } from '@/lib/content';
import PageTransition from '@/components/layout/PageTransition';

export default function HomePage() {
  const courses = ContentService.getCourses();
  const quizzes = ContentService.getQuizzes();
  return (
    <PageTransition>
      <EdurahExperience courseCount={courses.length} quizCount={quizzes.length} />
    </PageTransition>
  );
}
