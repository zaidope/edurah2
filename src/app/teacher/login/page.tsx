'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, ArrowRight } from 'lucide-react';
import EdurahLogo from '@/components/branding/EdurahLogo';
import PageTransition from '@/components/layout/PageTransition';

export default function TeacherLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const res = await login(email, password);

    if (res.success) {
      if (res.role === 'teacher') {
        router.push('/teacher');
      } else if (res.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMsg(res.error || 'Invalid credentials. Please verify your faculty email and password.');
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-16 bg-[#f6f2e9]">
        <div className="w-full max-w-md space-y-7 edurah-card-warm p-8 sm:p-10 rounded-2xl relative shadow-sm border border-[#d8d0c2]">
          
          {/* HEADER */}
          <div className="text-center space-y-3">
            <EdurahLogo size="md" className="justify-center" />
            
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider mb-2">
                <GraduationCap className="w-3.5 h-3.5 text-[#8e5a2b]" />
                Faculty & Staff Access
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819] tracking-tight">
                Teacher Sign In
              </h1>
              <p className="text-xs sm:text-sm text-[#6f6b63] mt-1.5 leading-relaxed">
                Enter your academic credentials to manage curricula, student cohorts, and assessments.
              </p>
            </div>
          </div>

          {/* ERROR NOTIFICATION */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                className="p-3.5 rounded-xl bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b] text-xs flex items-start gap-2.5"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-[#171819] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#8e5a2b]" /> Faculty Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty.name@edurah.edu"
                className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] placeholder:text-[#9d978c] text-sm focus:outline-none focus:border-[#d8a471] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#171819] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#8e5a2b]" /> Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] placeholder:text-[#9d978c] text-sm focus:outline-none focus:border-[#d8a471] pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9d978c] hover:text-[#171819] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="edurah-btn-primary w-full py-3 text-sm justify-center cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Authenticating Faculty...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign In to Faculty Portal
                </span>
              )}
            </button>
          </form>

          {/* STUDENT / GENERAL REDIRECT */}
          <div className="pt-4 border-t border-[#d8d0c2] text-center space-y-2">
            <p className="text-xs text-[#6f6b63]">
              Are you a student or parent?
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8e5a2b] hover:text-[#171819] transition-colors"
            >
              Go to Standard Portal Sign In <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
