'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, BookOpen, Layers, Award, Info, Shield, Menu, X, Sparkles, LogIn, LayoutDashboard } from 'lucide-react';
import SearchModal from '@/components/search/SearchModal';
import MobileDrawer from '@/components/layout/MobileDrawer';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdminRoute = pathname.startsWith('/admin');

  const navLinks = [
    { name: 'Subjects', href: '/subjects', icon: Layers },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Quizzes', href: '/quizzes', icon: Award },
    { name: 'About', href: '/about', icon: Info },
  ];

  if (profile) {
    navLinks.unshift({ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard });
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-slate-200/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* LOGO */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                    Edurah
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase -mt-1">
                    Learning Platform
                  </span>
                </div>
              </Link>

              {/* DESKTOP NAV LINKS */}
              {!isAdminRoute && (
                <nav className="hidden md:flex items-center gap-1 ml-4">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex items-center gap-3">
              {/* SEARCH BUTTON */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 text-xs font-medium transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Search courses, lessons...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-500 font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* AUTH USER PROFILE BADGE / LOGIN LINK */}
              {profile ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-800 hover:bg-slate-200/70 transition-colors font-medium"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {profile.fullName.charAt(0)}
                    </div>
                    <span className="hidden sm:inline font-medium">{profile.fullName}</span>
                  </Link>

                  {profile.role === 'admin' && (
                    <Link
                      href={isAdminRoute ? '/' : '/admin'}
                      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isAdminRoute
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isAdminRoute ? 'Exit Admin' : 'Admin Panel'}</span>
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Student Login</span>
                </Link>
              )}

              {/* MOBILE MENU TOGGLE */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SEARCH MODAL */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* MOBILE DRAWER */}
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}

