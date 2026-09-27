'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Layers, Info, Mail, X, ChevronRight, LogIn } from 'lucide-react';
import { ease, duration } from '@/lib/motion';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  const publicLinks = [
    { name: 'Courses', href: '/courses', icon: BookOpen, desc: 'Browse full curriculum catalog' },
    { name: 'Subjects', href: '/subjects', icon: Layers, desc: 'Specialized discipline tracks' },
    { name: 'About Edurah', href: '/about', icon: Info, desc: 'Our academic methodology' },
    { name: 'Contact & Support', href: '/contact', icon: Mail, desc: 'Get in touch with us' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
        >
          {/* BACKDROP */}
          <motion.div
            className="absolute inset-0 bg-[#0b0d0e]/60 backdrop-blur-xs"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* DRAWER PANEL */}
          <motion.div
            className="relative w-full bg-[#fbf9f5] border-t border-[#d8d0c2] rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-[#d8d0c2] bg-[#f6f2e9]">
              <span className="font-serif-heading text-lg font-normal text-[#171819] tracking-tight">Navigation</span>
              <button
                onClick={onClose}
                className="p-1.5 text-[#555048] hover:text-[#171819] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LINKS */}
            <div className="p-4 space-y-2 overflow-y-auto">
              {publicLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center justify-between p-3.5 border transition-all ${
                      isActive
                        ? 'bg-[#f3e5d4] border-[#d8a471] text-[#81512f]'
                        : 'bg-white border-[#d8d0c2] text-[#171819] hover:bg-[#ede8dc]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${isActive ? 'bg-[#d8a471] text-[#171819]' : 'bg-[#f6f2e9] text-[#555048]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs tracking-wider uppercase text-[#171819]">{link.name}</div>
                        <div className="text-[11px] text-[#706b63]">{link.desc}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#a59e93]" />
                  </Link>
                );
              })}

              <div className="pt-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#d8a471] text-[#172020] font-bold text-xs uppercase tracking-wider transition-colors hover:bg-[#e8b57c]"
                >
                  <LogIn className="w-4 h-4" /> Sign In to Learning Space
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
