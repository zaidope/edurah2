'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, LogOut, LayoutDashboard, GraduationCap, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import EdurahLogo from '@/components/branding/EdurahLogo';
import NotificationBell from '@/components/notifications/NotificationBell';

const publicNavLinks = [
  { name: 'Home', href: '/' },
  { name: 'Courses', href: '/courses' },
  { name: 'Subjects', href: '/subjects' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide the global header on internal admin and teacher workspaces (they have their own sidebars)
  const isInternalWorkspace = pathname.startsWith('/admin') || (pathname.startsWith('/teacher') && pathname !== '/teacher/login');
  if (isInternalWorkspace) return null;

  const isHome = pathname === '/';

  // Role-appropriate links
  let links = publicNavLinks;
  if (profile) {
    if (profile.role === 'student') {
      links = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'My Courses', href: '/courses' },
        { name: 'Subjects', href: '/subjects' },
        { name: 'Progress', href: '/my-learning' },
        { name: 'Profile', href: '/profile' },
      ];
    } else if (profile.role === 'teacher') {
      links = [
        { name: 'Faculty Hub', href: '/teacher' },
        { name: 'Course Catalog', href: '/courses' },
        { name: 'Subjects', href: '/subjects' },
      ];
    } else if (profile.role === 'admin') {
      links = [
        { name: 'Admin Console', href: '/admin' },
        { name: 'Course Catalog', href: '/courses' },
        { name: 'Subjects', href: '/subjects' },
      ];
    }
  }

  const linkClass = (href: string) => {
    const isActive = pathname === href;
    if (isHome) {
      return `text-xs font-semibold tracking-wider uppercase transition-colors ${
        isActive ? 'text-[#e6b981]' : 'text-[#e9e4d7]/70 hover:text-[#e9e4d7]'
      }`;
    }
    return `text-xs font-semibold tracking-wider uppercase transition-colors ${
      isActive ? 'text-[#81512f] font-bold' : 'text-[#555048] hover:text-[#171819]'
    }`;
  };

  return (
    <header
      className={`relative z-50 transition-colors duration-300 ${
        isHome
          ? 'bg-[#0b0d0e] text-[#e9e4d7] border-b border-white/10'
          : 'border-b border-[#d8d0c2] bg-[#f6f2e9]/95 text-[#171819] backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* LOGO */}
        <EdurahLogo theme={isHome ? 'dark' : 'light'} size="md" />

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.name}
            </Link>
          ))}
        </nav>

        {/* AUTH ACTIONS */}
        <div className="hidden items-center gap-4 md:flex">
          {profile ? (
            <div className="flex items-center gap-3">
              <NotificationBell theme={isHome ? 'dark' : 'light'} />
              <div className="flex items-center gap-2">
                {profile.role === 'teacher' && <GraduationCap className="w-3.5 h-3.5 text-[#81512f]" />}
                {profile.role === 'admin' && <Shield className="w-3.5 h-3.5 text-[#81512f]" />}
                <span className={`text-xs font-medium ${isHome ? 'text-[#e9e4d7]/75' : 'text-[#555048]'}`}>
                  {profile.fullName}
                </span>
              </div>
              <button
                onClick={() => void logout()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                  isHome
                    ? 'border-white/20 text-[#e9e4d7] hover:bg-white/10'
                    : 'border-[#d8d0c2] text-[#171819] hover:bg-[#ede8dc]'
                }`}
              >
                <LogOut className="h-3 w-3" /> Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#d8a471] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#172020] transition-transform hover:-translate-y-0.5 hover:bg-[#e8b57c] active:translate-y-0"
            >
              Sign In <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-2 md:hidden ${isHome ? 'text-[#e9e4d7]' : 'text-[#171819]'}`}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {menuOpen && (
        <div
          className={`border-t px-6 py-6 md:hidden ${
            isHome ? 'border-white/10 bg-[#101719]' : 'border-[#d8d0c2] bg-[#f6f2e9]'
          }`}
        >
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                onClick={() => setMenuOpen(false)}
                href={link.href}
                className={`py-1 text-sm font-medium ${
                  isHome ? 'text-[#e9e4d7] hover:text-[#d8a471]' : 'text-[#171819] hover:text-[#81512f]'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-4 border-t border-current/10 flex items-center justify-between">
              {profile ? (
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-medium text-current/70">{profile.fullName}</span>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-current/20"
                  >
                    <LogOut className="h-3 w-3" /> Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center bg-[#d8a471] py-2.5 text-xs font-bold uppercase tracking-wider text-[#172020]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
