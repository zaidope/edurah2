'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Layers, BookOpen, Film, HelpCircle, Image as ImageIcon, Settings, LogOut, Sparkles } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Subjects', href: '/admin/subjects', icon: Layers },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Lessons', href: '/admin/lessons', icon: Film },
    { name: 'Quizzes', href: '/admin/quizzes', icon: HelpCircle },
    { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        
        {/* ADMIN TITLE */}
        <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Edurah Admin</span>
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-4 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <span>Return to Website</span>
          <LogOut className="w-4 h-4 text-slate-400" />
        </Link>
      </div>
    </aside>
  );
}

