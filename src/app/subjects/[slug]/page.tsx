import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentService } from '@/lib/content';
import { ChevronLeft } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import AnimatedPage from '@/components/layout/AnimatedPage';
import { getSubjectIdentity } from '@/components/subjects/SubjectMotif';
import SubjectCatalog from './SubjectCatalog';

interface SubjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SubjectDetailPage({ params }: SubjectPageProps) {
  const { slug } = await params;
  const subject = ContentService.getSubjectBySlug(slug);

  if (!subject) {
    notFound();
  }

  const identity = getSubjectIdentity(slug);

  return (
    <PageTransition>
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 space-y-10">
          {/* BREADCRUMB */}
          <div>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#81512f] hover:text-[#171819] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> All Subject Tracks
            </Link>
          </div>

          {/* SUBJECT HERO HEADER WITH DISCIPLINE IDENTITY */}
          <div className={`p-8 sm:p-12 border border-[#d8d0c2] ${identity.heroBackground} shadow-lg relative overflow-hidden`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${identity.badgeBg}`}>
                  {subject.category} · {identity.discipline}
                </span>

                <h1 className="font-serif-hero text-3xl sm:text-5xl font-normal tracking-tight text-white leading-tight">
                  {subject.name}
                </h1>

                <p className="text-sm sm:text-base opacity-90 leading-relaxed max-w-xl">
                  {subject.description}
                </p>

              </div>

              <div className="lg:col-span-5">
                {identity.renderVisual()}
              </div>
            </div>
          </div>

          <SubjectCatalog subjectId={subject.id} subjectName={subject.name} />
        </div>
      </AnimatedPage>
    </PageTransition>
  );
}
