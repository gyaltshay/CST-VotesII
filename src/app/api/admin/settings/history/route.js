import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.electionSettings.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        votingStartTime: true,
        votingEndTime: true,
        autoResetEnabled: true,
        autoResetTime: true,
        autoResetDay: true,
        autoResetMonth: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 