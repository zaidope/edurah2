'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

interface EdurahLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'auto';
  showBadge?: boolean;
  badgeText?: string;
  href?: string;
  stacked?: boolean;
}

export default function EdurahLogo({
  className = '',
  size = 'md',
  theme = 'auto',
  showBadge = false,
  badgeText = '',
  href,
  stacked = false,
}: EdurahLogoProps) {
  const { profile } = useAuth();

  // Dynamic role-based destination for top-left branding links
  const targetHref =
    href !== undefined
      ? href
      : !profile
      ? '/'
      : profile.role === 'admin'
      ? '/admin'
      : profile.role === 'teacher'
      ? '/teacher'
      : '/dashboard';

  const heights = {
    sm: stacked ? 44 : 32,
    md: stacked ? 58 : 40,
    lg: stacked ? 74 : 50,
    xl: stacked ? 96 : 64,
  };

  const imageSrc = stacked
    ? '/images/edurah-logo.png'
    : '/images/edurah-logo-horizontal.png';

  const currentH = heights[size];

  const logoContent = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-102">
        <img
          src={imageSrc}
          alt="EDURAH — Solace of Education"
          style={{ height: `${currentH}px`, width: 'auto' }}
          className="object-contain block max-w-full drop-shadow-xs"
        />
      </div>

      {showBadge && badgeText && (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            theme === 'dark'
              ? 'bg-[#d8a471]/20 text-[#d8a471] border border-[#d8a471]/40'
              : 'bg-[#ede6d8] text-[#8e5a2b] border border-[#d8d0c2]'
          }`}
        >
          {badgeText}
        </span>
      )}
    </div>
  );

  if (targetHref) {
    return (
      <Link
        href={targetHref}
        className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-[#d8a471] rounded-lg transition-opacity hover:opacity-95"
        title="EDURAH — Solace of Education"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
