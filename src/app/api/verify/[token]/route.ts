import { NextRequest, NextResponse } from 'next/server';
import { CommunicationService } from '@/lib/communication';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: 'Verification token required' } },
        { status: 400 }
      );
    }

    const verification = CommunicationService.verifyCertificateByToken(token);
    if (!verification.valid || !verification.certificate) {
      return NextResponse.json(
        {
          data: { valid: false },
          error: { code: 'INVALID_CERTIFICATE', message: 'No valid academic credential was found for this token.' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        valid: true,
        certificate: verification.certificate,
      },
      error: null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: err.message || 'Verification error' } },
      { status: 500 }
    );
  }
}
