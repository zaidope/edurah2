'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      
      {/* HEADER */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          <Mail className="w-3.5 h-3.5 text-blue-600" /> Direct Support & Feedback
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Get in Touch with Edurah</h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Have questions about our course curriculum, corporate training, or platform features? Send us a message.
        </p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
        {submitted ? (
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Message Sent Successfully!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Thank you for reaching out to Edurah. Our educational team will respond to {formData.email} within 24 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 shadow-xs"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Mercer"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@example.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Subject / Category</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Course Inquiry, Technical Question, etc."
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Message Details</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can we assist your learning journey?"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        )}
      </div>

    </div>
  );
}

