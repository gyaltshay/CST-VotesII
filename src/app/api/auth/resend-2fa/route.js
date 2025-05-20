import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { sendTwoFactorCode } from '@/lib/2fa';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await sendTwoFactorCode(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend 2FA code error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend code' },
      { status: 400 }
    );
  }
} 