import React from 'react';
import Link from 'next/link';
import { CommunicationService } from '@/lib/communication';
import EdurahLogo from '@/components/branding/EdurahLogo';
import { Award, CheckCircle2, ShieldCheck, ArrowLeft, Calendar, FileText, AlertTriangle } from 'lucide-react';

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verification = CommunicationService.verifyCertificateByToken(token);

  const cert = verification.certificate;

  return (
    <div className="min-h-screen bg-[#f6f2e9] text-[#171819] flex flex-col justify-between p-4 sm:p-8">
      {/* HEADER */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#d8d0c2]">
        <EdurahLogo theme="light" size="md" href="/" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#81512f] flex items-center gap-1.5 bg-[#fcfbf9] px-3 py-1 border border-[#d8d0c2]">
          <ShieldCheck className="w-4 h-4 text-[#2e7d32]" /> Cryptographic Registry
        </span>
      </div>

      {/* MAIN CREDENTIAL CARD */}
      <main className="max-w-2xl mx-auto w-full my-8">
        <div className="bg-[#fcfbf9] border border-[#d8d0c2] shadow-xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#81512f]" />

          {verification.valid && cert ? (
            <>
              {/* STATUS BADGE */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#e8f5e9] border border-[#c8e6c9]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2e7d32] text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-[#1b5e20] uppercase tracking-wider">
                      Official Academic Credential Verified
                    </h2>
                    <p className="text-xs text-[#2e7d32]">
                      This certificate was authoritatively conferred by EDURAH Academy.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono-code font-bold text-[#1b5e20] bg-white px-2.5 py-1 border border-[#c8e6c9] self-start sm:self-auto">
                  STATUS: AUTHENTIC
                </span>
              </div>

              {/* CREDENTIAL PARTICULARS */}
              <div className="space-y-6 pt-2 text-center sm:text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#81512f]">
                    Conferred Recipient
                  </span>
                  <h1 className="font-serif-hero text-2xl sm:text-3xl text-[#171819]">
                    {cert.studentName}
                  </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-white border border-[#d8d0c2] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#706b63] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#81512f]" /> Accredited Course
                    </span>
                    <p className="font-semibold text-xs text-[#171819]">{cert.courseTitle}</p>
                  </div>

                  <div className="p-4 bg-white border border-[#d8d0c2] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#706b63] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#81512f]" /> Serial Identifier
                    </span>
                    <p className="font-mono-code font-bold text-xs text-[#81512f]">{cert.serial}</p>
                  </div>

                  <div className="p-4 bg-white border border-[#d8d0c2] space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#706b63] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#81512f]" /> Date of Conformance
                    </span>
                    <p className="text-xs text-[#171819]">
                      {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* INSTITUTIONAL AUTHORITY NOTE */}
                <div className="border-t border-[#e8e2d5] pt-4 text-xs text-[#706b63] leading-relaxed space-y-1">
                  <p>
                    <strong>Institutional Registry Seal:</strong> Conferral of this credential signifies 100% curriculum completion and verified academic standing. Private student demographic data and records are sealed per institutional privacy regulations.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#ffebee] border border-[#ffcdd2] text-[#c62828] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-serif-heading text-xl text-[#171819]">
                  Certificate Not Found or Invalid
                </h2>
                <p className="text-xs text-[#706b63] max-w-sm mx-auto">
                  The verification token provided does not match any official academic credential issued in the EDURAH Registry.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#e8e2d5] flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#81512f] hover:text-[#171819] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to EDURAH
            </Link>
            <span className="text-[10px] font-mono-code text-[#8a8376]">
              Registry Token: {token.substring(0, 16)}...
            </span>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-3xl mx-auto w-full text-center text-xs text-[#8a8376] pt-6 border-t border-[#d8d0c2]">
        EDURAH Multi-Grade Learning Management System · Cryptographic Credential Registry
      </footer>
    </div>
  );
}
