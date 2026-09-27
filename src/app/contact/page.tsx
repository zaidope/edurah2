'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
          
          {/* HEADER */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede6d8] border border-[#d8d0c2] text-[#8e5a2b] text-[11px] font-bold uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5 text-[#d8a471]" /> Institutional Inquiries & Support
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif-hero font-normal text-[#171819] tracking-tight">
              Get in Touch with Edurah
            </h1>
            <p className="text-sm sm:text-base text-[#6f6b63] max-w-xl mx-auto leading-relaxed">
              Have questions regarding our developmental grade curricula, admissions, faculty provisioning, or technical platform features? Send us a message.
            </p>
          </div>

          {/* FORM CARD */}
          <div className="edurah-card-warm p-8 sm:p-12 rounded-3xl shadow-xs border border-[#d8d0c2]">
            {submitted ? (
              <div className="text-center py-10 space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif-heading text-2xl font-normal text-[#171819]">Message Dispatched Successfully</h3>
                  <p className="text-xs sm:text-sm text-[#6f6b63] max-w-md mx-auto leading-relaxed">
                    Thank you for contacting the Edurah academic team. We have received your inquiry and will follow up with {formData.email} shortly.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="edurah-btn-secondary text-xs px-5 py-2.5 inline-flex items-center gap-2"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-bold text-[#171819] uppercase tracking-wider text-[11px]">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. Arthur Pendelton"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] placeholder:text-[#9d978c] text-sm focus:outline-none focus:border-[#d8a471] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-[#171819] uppercase tracking-wider text-[11px]">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="arthur@institution.edu"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] placeholder:text-[#9d978c] text-sm focus:outline-none focus:border-[#d8a471] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-[#171819] uppercase tracking-wider text-[11px]">Inquiry Category</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Curriculum Alignment, Cohort Enrollment, Technical Support"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] placeholder:text-[#9d978c] text-sm focus:outline-none focus:border-[#d8a471] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-[#171819] uppercase tracking-wider text-[11px]">Message Details</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How may we assist your institution or learning journey?"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-[#d8d0c2] text-[#171819] placeholder:text-[#9d978c] text-sm focus:outline-none focus:border-[#d8a471] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="edurah-btn-primary w-full sm:w-auto px-8 py-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Send Inquiry
                </button>
              </form>
            )}
          </div>

        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
