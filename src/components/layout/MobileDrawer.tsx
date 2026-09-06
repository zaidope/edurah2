'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, BookOpen, Award, Info, Shield, Mail, X, Sparkles, ChevronRight } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  const links = [
    { name: 'Subjects', href: '/subjects', icon: Layers, desc: 'Explore major learning tracks' },
    { name: 'Courses', href: '/courses', icon: BookOpen, desc: 'Browse all video courses' },
    { name: 'Quizzes', href: '/quizzes', icon: Award, desc: 'Practice with interactive quizzes' },
    { name: 'About Edurah', href: '/about', icon: Info, desc: 'Our mission & methodology' },
    { name: 'Contact & Support', href: '/contact', icon: Mail, desc: 'Get in touch with us' },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="w-full bg-white border-t border-slate-200 rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-xl animate-in slide-in-from-bottom duration-300">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Edurah Menu</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="p-4 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={onClose}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{link.name}</div>
                    <div className="text-xs text-slate-500">{link.desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            );
          })}

          {/* ADMIN LINK */}
          <div className="pt-2">
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Admin Panel</div>
                  <div className="text-xs text-amber-700">Manage subjects & content</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-600" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

