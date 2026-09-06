'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Lock, Mail, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
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
      if (email.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMsg(res.error || 'Invalid credentials. Please verify your student email and password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        
        {/* BRAND LOGO HEADER */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Portal Sign In</h1>
            <p className="text-xs text-slate-500 mt-0.5">Enter your assigned Edurah credentials to access your courses.</p>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Student Email or ID
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.mercer@edurah.edu"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Edurah</span>
              </>
            )}
          </button>
        </form>

        {/* DEMO NOTICE */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
          <p>Student accounts are issued by Edurah administrators.</p>
          <p className="text-slate-600">Demo student login: <strong>alex.mercer@edurah.edu</strong></p>
        </div>

      </div>
    </div>
  );
}

