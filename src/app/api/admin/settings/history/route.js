import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/config/auth';
import prisma from '@/lib/prisma';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authConfig);
    
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

    // Log the action
    await logAction({
      action: 'VIEW_SETTINGS_HISTORY',
      entityType: 'SETTINGS',
      userId: session.user.id,
      metadata: {
        count: settings.length,
        duration: Date.now() - startTime
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings history:', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 