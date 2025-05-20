import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get election settings
    const settings = await prisma.electionSettings.findFirst();
    
    // Get voter statistics
    const [totalVoters, votes] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.vote.findMany({
        select: {
          userId: true
        }
      })
    ]);

    // Calculate unique voters
    const uniqueVoters = new Set(votes.map(vote => vote.userId)).size;

    // Check if election is active
    const now = new Date();
    const startTime = settings?.votingStartTime ? new Date(settings.votingStartTime) : null;
    const endTime = settings?.votingEndTime ? new Date(settings.votingEndTime) : null;
    
    const isActive = settings?.isActive && 
      startTime && endTime &&
      now >= startTime && now <= endTime;

    return NextResponse.json({
      isActive,
      startTime: settings?.votingStartTime,
      endTime: settings?.votingEndTime,
      totalVoters,
      votedCount: uniqueVoters
    });
  } catch (error) {
    console.error('Failed to fetch election status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 