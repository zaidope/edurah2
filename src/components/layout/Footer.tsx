import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, Globe, Share2, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-200">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Edurah</span>
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              An authoritative, video-first learning platform built for deep mastery across computer science, software engineering, artificial intelligence, and mathematics.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-xs">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-xs">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-xs">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* EXPLORE */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/subjects" className="hover:text-blue-600 transition-colors">All Subjects</Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-blue-600 transition-colors">Course Catalog</Link>
              </li>
              <li>
                <Link href="/quizzes" className="hover:text-blue-600 transition-colors">Interactive Quizzes</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">Our Methodology</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* FEATURED SUBJECTS */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Top Subjects</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/subjects/computer-science" className="hover:text-blue-600 transition-colors">Computer Science</Link>
              </li>
              <li>
                <Link href="/subjects/web-development" className="hover:text-blue-600 transition-colors">Web Development</Link>
              </li>
              <li>
                <Link href="/subjects/artificial-intelligence" className="hover:text-blue-600 transition-colors">Artificial Intelligence</Link>
              </li>
              <li>
                <Link href="/subjects/mathematics" className="hover:text-blue-600 transition-colors">Mathematics & Logic</Link>
              </li>
            </ul>
          </div>

          {/* ADMIN & RESOURCES */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Administration</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/admin" className="flex items-center gap-1 text-amber-700 hover:text-amber-900 transition-colors font-medium">
                  Admin Dashboard <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/admin/courses" className="hover:text-blue-600 transition-colors">Manage Curriculum</Link>
              </li>
              <li>
                <Link href="/admin/quizzes" className="hover:text-blue-600 transition-colors">Quiz Editor</Link>
              </li>
              <li>
                <Link href="/admin/media" className="hover:text-blue-600 transition-colors">Media Library</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM METADATA */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Edurah Learning Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Security</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

