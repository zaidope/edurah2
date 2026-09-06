'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ContentService } from '@/lib/content';
import { ProgressService } from '@/lib/progress';
import SearchModal from '@/components/search/SearchModal';
import AssignmentModal from '@/components/dashboard/AssignmentModal';
import {
  Search,
  Bell,
  Globe,
  Flame,
  ArrowRight,
  Video,
  BookOpen,
  Edit3,
  FileText,
  Award,
  ChevronRight,
  Star,
  CheckCircle2,
  Calendar,
  Zap,
  Check,
  PlayCircle
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [progress, setProgress] = useState(ProgressService.getProgress());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [liveClassNotice, setLiveClassNotice] = useState(false);

  const courses = ContentService.getCourses();
  const quizzes = ContentService.getQuizzes();

  useEffect(() => {
    setProgress(ProgressService.getProgress());
  }, []);

  const studentFirstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Kaab';
  const studentLevel = profile?.classGroup || 'Level 4 Learner';

  // Determine continue learning target
  const lastActive = progress.lastViewedLesson;
  const continueCourse = courses.find(c => c.slug === lastActive?.courseSlug) || courses[0];
  const continueLesson = continueCourse?.chapters[0]?.lessons[0];
  const continueCourseProgress = continueCourse ? ProgressService.getCourseProgress(continueCourse.id) : 0;

  // Dynamic calculations
  const streakDays = ProgressService.calculateStreak();
  const overallPercentage = ProgressService.getOverallProgress(courses);
  const achievements = ProgressService.getAchievements();

  const handleJoinLiveClass = () => {
    setLiveClassNotice(true);
    setTimeout(() => setLiveClassNotice(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

      {/* TOP HEADER BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* GREETING */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            Good Morning, <span className="text-teal-600 font-black">{studentFirstName}!</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* SEARCH BAR (TRIGGERS INTERACTIVE SEARCH MODAL) */}
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="relative flex-1 max-w-lg mx-0 lg:mx-4 cursor-pointer"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            readOnly
            placeholder="Search for courses, lessons, resources... (Ctrl + K)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs cursor-pointer hover:bg-slate-100/80 transition-all shadow-inner"
          />
        </div>

        {/* TOP RIGHT PROFILE & NOTIFICATIONS */}
        <div className="flex items-center gap-3 justify-between lg:justify-end">
          
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white">
              7
            </span>
          </button>

          <button className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
            <Globe className="w-4 h-4" />
          </button>

          <Link href="/profile" className="flex items-center gap-3 pl-2 border-l border-slate-200 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-teal-600 border-2 border-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden group-hover:scale-105 transition-transform">
                {studentFirstName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            <div className="hidden sm:block text-left">
              <div className="font-bold text-slate-900 text-xs leading-tight group-hover:text-teal-600 transition-colors">{studentFirstName}</div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 inline-block mt-0.5">
                {studentLevel}
              </span>
            </div>
          </Link>

        </div>

      </div>

      {/* LIVE CLASS NOTIFICATION BANNER */}
      {liveClassNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Connecting to Live Classroom session for <strong>English Conversation</strong>...</span>
          </div>
          <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded">Launching Stream</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: HERO + TODAY'S PLAN + MY COURSES (8 COLS) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* CONTINUE LEARNING HERO BANNER */}
          {continueCourse && continueLesson && (
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0F2850] via-[#164E63] to-[#0891B2] text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-cyan-900/40">
              
              {/* BACKGROUND DECORATIVE GLOW */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

              {/* HERO TEXT & CONTENT */}
              <div className="space-y-4 max-w-md relative z-10 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                  Continue Learning
                </span>

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {continueCourse.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-cyan-100 font-medium">
                    Next up: <strong>{lastActive?.title || continueLesson.title}</strong>
                  </p>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-cyan-200">{continueCourseProgress}% Completed</span>
                  </div>
                  <div className="w-full bg-slate-900/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-cyan-500/30">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-sm" 
                      style={{ width: `${Math.max(continueCourseProgress, 15)}%` }} 
                    />
                  </div>
                </div>

                {/* CONTINUE LESSON BUTTON */}
                <div className="pt-2">
                  <Link
                    href={`/courses/${continueCourse.slug}/lessons/${lastActive?.lessonSlug || continueLesson.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    Continue Lesson <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>

              {/* HERO IMAGE ILLUSTRATION */}
              <div className="relative w-full md:w-72 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl flex-shrink-0">
                <img
                  src="/edurah_hero.jpg"
                  alt="Edurah Student Learning"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
              </div>

            </div>
          )}

          {/* TODAY'S PLAN SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Today's Plan
              </h2>
              <button 
                onClick={() => router.push('/my-learning')}
                className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* LIVE CLASS CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-emerald-300 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    10:00 AM
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Class</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">English Conversation</h3>
                </div>
                <button 
                  onClick={handleJoinLiveClass}
                  className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                >
                  Join Now
                </button>
              </div>

              {/* LESSON CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-purple-300 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lesson 13</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">Describing People</h3>
                </div>
                <button 
                  onClick={() => {
                    if (continueCourse && continueLesson) {
                      router.push(`/courses/${continueCourse.slug}/lessons/${continueLesson.slug}`);
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-bold text-xs border border-purple-200 transition-colors cursor-pointer"
                >
                  Start Lesson
                </button>
              </div>

              {/* PRACTICE CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    15 Words
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Practice</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">Vocabulary Practice</h3>
                </div>
                <button 
                  onClick={() => {
                    if (quizzes[0]) {
                      router.push(`/quizzes/${quizzes[0].id}`);
                    } else {
                      router.push('/quizzes');
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs border border-blue-200 transition-colors cursor-pointer"
                >
                  Practice Now
                </button>
              </div>

              {/* ASSIGNMENT CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-amber-300 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Due Tomorrow
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">My School Project</h3>
                </div>
                <button 
                  onClick={() => setIsAssignmentOpen(true)}
                  className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>

            </div>
          </div>

          {/* MY COURSES SECTION (DYNAMIC FROM CONTENT SERVICE & PROGRESS SERVICE) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                My Courses
              </h2>
              <Link href="/courses" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {courses.slice(0, 4).map((course, index) => {
                const cProgress = ProgressService.getCourseProgress(course.id);
                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs hover:shadow-md transition-all group block"
                  >
                    <div className="aspect-video rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={index === 0 ? '/edurah_hero.jpg' : '/course_grammar.jpg'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-teal-600 text-white font-bold text-[9px] uppercase">
                        {course.level}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-teal-600 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">{course.subjectName}</p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(cProgress, 10)}%` }}
                        />
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 text-right">{cProgress}%</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STREAK + OVERALL PROGRESS + ACHIEVEMENTS + UPCOMING (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* LEARNING STREAK CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Streak</span>
                <div className="text-3xl font-black text-slate-900 flex items-center gap-2 mt-1">
                  {streakDays} <span className="text-sm font-bold text-slate-500">Days</span>
                </div>
              </div>
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md animate-pulse">
                <Flame className="w-8 h-8 fill-amber-200 text-amber-100" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-semibold">
              🔥 Great going! Keep it up and make learning a daily habit.
            </div>
          </div>

          {/* OVERALL PROGRESS CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Progress</span>
                <div className="text-xs font-bold text-slate-700 mt-0.5">{studentLevel} Target</div>
              </div>
              <div className="text-2xl font-black text-teal-600">{overallPercentage}%</div>
            </div>

            {/* DONUT PROGRESS BAR VISUAL */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-teal-500 transition-all duration-500"
                    strokeDasharray={`${overallPercentage}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-xs text-slate-800">
                  {overallPercentage}%
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  You are ahead of 84% of students in your batch!
                </p>
                <Link href="/my-learning" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 pt-1">
                  View Detailed Progress <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ACHIEVEMENTS BADGES CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Achievements
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {achievements.map((badge) => {
                const iconMap = {
                  Star: Star,
                  Zap: Zap,
                  Award: Award,
                  CheckCircle2: CheckCircle2,
                };
                const BIcon = iconMap[badge.iconName] || Star;
                return (
                  <div 
                    key={badge.id} 
                    title={badge.description}
                    className={`flex flex-col items-center space-y-1.5 p-2 rounded-xl transition-all ${
                      badge.unlocked ? 'opacity-100 hover:bg-slate-50' : 'opacity-40 grayscale'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-2xl ${badge.color} flex items-center justify-center shadow-xs border-2 border-white`}>
                      <BIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 leading-tight">
                      {badge.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* UPCOMING SCHEDULE CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" /> Upcoming Events
              </h3>
            </div>

            <div className="space-y-3">
              
              {/* SCHEDULE ITEM 1 */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700">Live Class</span>
                  <h4 className="font-extrabold text-slate-900 text-xs">Public Speaking Basics</h4>
                  <p className="text-[10px] font-semibold text-slate-500">Tomorrow, 10:00 AM</p>
                </div>
              </div>

              {/* SCHEDULE ITEM 2 */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-600 text-white flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase text-purple-700">Assessment</span>
                  <h4 className="font-extrabold text-slate-900 text-xs">Grammar Quiz – 2</h4>
                  <p className="text-[10px] font-semibold text-slate-500">May 25, 2025</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* INTERACTIVE SEARCH MODAL */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* INTERACTIVE ASSIGNMENT MODAL */}
      <AssignmentModal isOpen={isAssignmentOpen} onClose={() => setIsAssignmentOpen(false)} />

    </div>
  );
}
