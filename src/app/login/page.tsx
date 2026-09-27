'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, ArrowRight } from 'lucide-react';
import EdurahLogo from '@/components/branding/EdurahLogo';
import PageTransition from '@/components/layout/PageTransition';
import { ease, duration } from '@/lib/motion';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
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
      if (returnUrl && returnUrl.startsWith('/')) {
        router.push(returnUrl);
      } else if (res.role === 'admin') {
        router.push('/admin');
      } else if (res.role === 'teacher') {
        router.push('/teacher');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMsg(res.error || 'Invalid credentials. Please verify your email and password.');
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-md bg-[#fcfbf9] p-8 sm:p-10 border border-[#d8d0c2] shadow-sm relative overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: duration.normal, ease: ease.outCubic }}
    >
      {/* TOP DECORATIVE ACCENT */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d8a471] via-[#ba6c45] to-[#d8a471]" />

      {/* BRAND LOGO & HEADER */}
      <div className="text-center space-y-3">
        <EdurahLogo size="md" className="justify-center" />

        <div className="pt-2 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#81512f] font-mono-code">
            Portal Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif-heading font-normal text-[#171819] tracking-tight">
            Sign In to Edurah
          </h1>
          <p className="text-xs text-[#6f6b63] max-w-xs mx-auto leading-relaxed">
            Enter your student, educator, or administrative credentials to access your workspace.
          </p>
        </div>
      </div>

      {/* ERROR BANNER */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            className="mt-6 p-3.5 bg-[#fbf0ec] border border-[#e8bead] text-[#81301c] text-xs flex items-start gap-2.5"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <AlertCircle className="w-4 h-4 text-[#ba6c45] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-[#171819] flex items-center gap-1.5 tracking-wide">
            <Mail className="w-3.5 h-3.5 text-[#81512f]" />
            <span>Email Address</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@edurah.edu"
            className="w-full px-3.5 py-2.5 bg-white border border-[#d8d0c2] text-[#171819] placeholder:text-[#a59e93] text-sm focus:outline-none focus:border-[#d8a471] focus:ring-1 focus:ring-[#d8a471] transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[#171819] flex items-center gap-1.5 tracking-wide">
              <Lock className="w-3.5 h-3.5 text-[#81512f]" />
              <span>Password</span>
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-[#d8d0c2] text-[#171819] placeholder:text-[#a59e93] text-sm focus:outline-none focus:border-[#d8a471] focus:ring-1 focus:ring-[#d8a471] pr-10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f786e] hover:text-[#171819] transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 bg-[#171819] hover:bg-[#0b0d0e] text-[#f6f2e9] font-bold text-xs tracking-wider uppercase border border-[#171819] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-[#f6f2e9] border-t-transparent rounded-full animate-spin" />
              Signing In...
            </span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#d8a471]" />
            </>
          )}
        </button>
      </form>

      {/* FOOTNOTE */}
      <div className="pt-6 mt-6 border-t border-[#e8e2d5] text-center text-xs text-[#7f786e] space-y-1">
        <p>Student and faculty accounts are provisioned by Edurah administrators.</p>
        <p>
          Looking to explore?{' '}
          <Link href="/courses" className="text-[#81512f] font-semibold underline underline-offset-2 hover:text-[#171819]">
            Browse the public course catalog →
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center px-4 py-12">
        <Suspense fallback={
          <div className="w-full max-w-md bg-[#fcfbf9] p-12 border border-[#d8d0c2] text-center text-xs text-[#6f6b63]">
            <div className="w-8 h-8 rounded-full border-2 border-[#81512f] border-t-transparent animate-spin mx-auto mb-3" />
            Preparing Sign In Portal...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </PageTransition>
  );
}
