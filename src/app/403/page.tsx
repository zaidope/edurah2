import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import EdurahLogo from '@/components/branding/EdurahLogo';

export default function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#f6f2e9]">
      <div className="max-w-md w-full edurah-card-warm p-8 sm:p-10 rounded-2xl border border-[#d8d0c2] shadow-sm text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full inline-block border border-rose-200">
            Error 403 · Access Forbidden
          </div>
          <h1 className="text-2xl font-serif-heading font-normal text-[#171819]">
            Restricted Area
          </h1>
          <p className="text-xs sm:text-sm text-[#6f6b63] leading-relaxed">
            Your authenticated role does not possess the institutional privileges required to access this resource or administrative console.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/login"
            className="edurah-btn-primary w-full py-2.5 justify-center text-xs"
          >
            <LogIn className="w-4 h-4" /> Switch Account
          </Link>
          <Link
            href="/"
            className="edurah-btn-secondary w-full py-2.5 justify-center text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
