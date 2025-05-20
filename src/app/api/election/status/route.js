import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const status = await prisma.electionStatus.findFirst();
    
    if (!status) {
      return NextResponse.json({
        isActive: false,
        startTime: null,
        endTime: null
      });
    }

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

    return NextResponse.json({
      ...status,
      totalVoters,
      votedCount: uniqueVoters
    });
  } catch (error) {
    console.error('Error fetching election status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch election status' },
      { status: 500 }
    );
  }
}