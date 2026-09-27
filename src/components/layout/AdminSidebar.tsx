'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Film,
  Award,
  FileQuestion,
  TrendingUp,
  Image as ImageIcon,
  Settings,
  LogOut,
  ChevronRight,
  Layers
} from 'lucide-react';
import EdurahLogo from '@/components/branding/EdurahLogo';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Faculty Teachers', href: '/admin/teachers', icon: GraduationCap },
    { name: 'Enrolled Students', href: '/admin/students', icon: Users },
    { name: 'Courses & Syllabi', href: '/admin/courses', icon: BookOpen },
    { name: 'Lessons & Units', href: '/admin/lessons', icon: Film },
    { name: 'Assessments', href: '/admin/quizzes', icon: Award },
    { name: 'PDF Quiz Compiler', href: '/admin/quiz-maker', icon: FileQuestion },
    { name: 'Institutional Analytics', href: '/admin/progress', icon: TrendingUp },
    { name: 'DB Content Migration', href: '/admin/migrate-local-content', icon: Layers },
    { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
    { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0b0d0e] border-r border-[#26282a] flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] shrink-0">
      <div className="p-4 space-y-6">
        
        {/* LOGO & ADMIN BADGE */}
        <div className="pb-4 border-b border-[#26282a] flex items-center justify-between">
          <EdurahLogo size="sm" showBadge badgeText="GOVERNANCE" href="/admin" />
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#d8a471] text-[#0b0d0e] font-bold shadow-xs'
                    : 'text-[#9d978c] hover:text-[#f6f2e9] hover:bg-[#17191b]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0b0d0e]' : 'text-[#6f6b63]'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#0b0d0e]" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-4 border-t border-[#26282a] space-y-2">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#9d978c] hover:text-[#f6f2e9] hover:bg-[#17191b] transition-colors"
        >
          <span>Return to Public Site</span>
          <LogOut className="w-3.5 h-3.5 text-[#6f6b63]" />
        </Link>
      </div>
    </aside>
  );
}
