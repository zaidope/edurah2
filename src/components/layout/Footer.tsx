'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Share2, Mail, Sparkles } from 'lucide-react';
import EdurahLogo from '@/components/branding/EdurahLogo';

export default function Footer() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isInternal = pathname.startsWith('/admin') || (pathname.startsWith('/teacher') && pathname !== '/teacher/login');
  if (isHomePage || isInternal) return null;

  return (
    <footer className="border-t border-[#d8d0c2] bg-[#ede8dc] text-[#555048] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#d8d0c2]">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-2 space-y-4">
            <EdurahLogo size="md" theme="light" />
            <p className="text-xs text-[#555048] leading-relaxed max-w-sm">
              An authoritative multi-grade educational platform built for deep academic mastery from foundational primary grades through advanced high school curricula.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="edurah-eyebrow">
                <span /> Structured Learning
              </span>
            </div>
          </div>

          {/* PLATFORM CURRICULUM */}
          <div>
            <h3 className="text-[11px] font-bold text-[#171819] uppercase tracking-wider mb-4">Curriculum</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/courses" className="hover:text-[#171819] transition-colors">Course Catalog</Link>
              </li>
              <li>
                <Link href="/subjects" className="hover:text-[#171819] transition-colors">Subject Tracks</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#171819] transition-colors">Our Methodology</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#171819] transition-colors">Support & Contact</Link>
              </li>
            </ul>
          </div>

          {/* PRIMARY DISCIPLINES */}
          <div>
            <h3 className="text-[11px] font-bold text-[#171819] uppercase tracking-wider mb-4">Disciplines</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/subjects/mathematics" className="hover:text-[#171819] transition-colors">Mathematics & Logic</Link>
              </li>
              <li>
                <Link href="/subjects/computer-science" className="hover:text-[#171819] transition-colors">Computer Science</Link>
              </li>
              <li>
                <Link href="/subjects/artificial-intelligence" className="hover:text-[#171819] transition-colors">Artificial Intelligence</Link>
              </li>
              <li>
                <Link href="/subjects/web-development" className="hover:text-[#171819] transition-colors">Web Development</Link>
              </li>
            </ul>
          </div>

          {/* ACCESS */}
          <div>
            <h3 className="text-[11px] font-bold text-[#171819] uppercase tracking-wider mb-4">Portals</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/login" className="hover:text-[#171819] font-medium transition-colors">Student & Educator Sign In</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#171819] transition-colors">About Edurah</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#171819] transition-colors">Inquire About Enrollment</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM METADATA */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#7f786e]">
          <p>© {new Date().getFullYear()} Edurah Learning Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Authoritative Multi-Grade Educational Architecture</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
