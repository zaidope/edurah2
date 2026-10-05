'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, BadgeCheck, BookOpen, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

type Certificate = {
  id: string;
  serial: string;
  issued_at: string;
  verification_token: string;
  courses: { title: string } | null;
};

type CertificateQueryRow = Omit<Certificate, 'courses'> & { courses: { title: string }[] | { title: string } | null };

export default function PassportPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      router.replace('/login');
      return;
    }
    if (profile.role !== 'student') {
      router.replace('/dashboard');
      return;
    }

    let active = true;
    void supabase.from('certificates')
      .select('id,serial,issued_at,verification_token,courses(title)')
      .eq('student_id', profile.id)
      .order('issued_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError('Your certificate records are unavailable right now.');
          setCertificates([]);
        } else {
          setError('');
          setCertificates(((data || []) as CertificateQueryRow[]).map((certificate) => ({
            ...certificate,
            courses: Array.isArray(certificate.courses) ? certificate.courses[0] || null : certificate.courses,
          })));
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [authLoading, profile, router]);

  if (authLoading || !profile || profile.role !== 'student') {
    return <main className="grid min-h-[60vh] place-items-center text-sm text-[#706b63]">Loading passport…</main>;
  }

  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-[#f6f2e9] px-4 py-10 text-[#171819] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d8d0c2] pb-6">
          <div>
            <Link href="/dashboard" className="mb-4 inline-flex text-xs font-semibold text-[#81512f] hover:text-[#171819]">Student dashboard</Link>
            <p className="edurah-eyebrow"><span /> VERIFIED ACHIEVEMENTS</p>
            <h1 className="mt-2 font-serif-hero text-4xl sm:text-5xl">Learning passport</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#706b63]">Certificates issued for your completed courses appear here.</p>
          </div>
          <div className="inline-flex items-center gap-2 border border-[#d8d0c2] bg-white px-4 py-3 text-xs font-semibold text-[#81512f]">
            <Award className="h-4 w-4" /> {certificates.length} {certificates.length === 1 ? 'certificate' : 'certificates'}
          </div>
        </header>

        {error && <div role="alert" className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>}
        {loading ? <div className="flex items-center justify-center gap-2 py-20 text-sm text-[#706b63]"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading issued records</div> : certificates.length ? (
          <section className="divide-y divide-[#d8d0c2] border-y border-[#d8d0c2] bg-white">
            {certificates.map((certificate) => <article key={certificate.id} className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center border border-[#d8d0c2] bg-[#f6f2e9] text-[#81512f]"><BookOpen className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <h2 className="font-serif-heading text-xl">{certificate.courses?.title || 'Course certificate'}</h2>
                  <p className="mt-1 text-xs text-[#706b63]">Issued {new Date(certificate.issued_at).toLocaleDateString()} · {certificate.serial}</p>
                </div>
              </div>
              <Link href={`/verify/${encodeURIComponent(certificate.verification_token)}`} className="inline-flex items-center gap-2 border border-[#d8d0c2] px-3 py-2 text-xs font-bold text-[#81512f] hover:bg-[#fcfbf9]">
                <BadgeCheck className="h-4 w-4" /> Verify certificate
              </Link>
            </article>)}
          </section>
        ) : !error ? (
          <div className="border border-dashed border-[#d8d0c2] bg-white px-5 py-16 text-center">
            <Award className="mx-auto h-7 w-7 text-[#956643]" />
            <h2 className="mt-3 font-serif-heading text-xl">No certificates issued yet</h2>
            <p className="mt-1 text-sm text-[#706b63]">When a course certificate is issued, it will be listed here.</p>
            <Link href="/my-learning" className="mt-5 inline-flex border border-[#d8d0c2] px-4 py-2.5 text-xs font-bold text-[#81512f]">Browse my learning</Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}