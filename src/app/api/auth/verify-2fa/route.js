import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { verifyTwoFactorCode } from '@/lib/2fa';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Verify the code
    await verifyTwoFactorCode(session.user.id, code);

    // Update user's email verification status if not already verified
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { emailVerified: new Date() }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify code' },
      { status: 400 }
    );
  }
} 