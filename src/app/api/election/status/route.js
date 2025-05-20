import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const election = await prisma.electionSettings.findFirst({
      where: {
        isActive: true
      }
    });

    if (!election) {
      return NextResponse.json({
        isActive: false,
        message: 'No active election found'
      });
    }

    const now = new Date();
    const startTime = new Date(election.votingStartTime);
    const endTime = new Date(election.votingEndTime);
    const isActive = election.isActive && now >= startTime && now <= endTime;

    return NextResponse.json({
      isActive,
      startTime: election.votingStartTime,
      endTime: election.votingEndTime,
      message: isActive ? 'Voting is active' : 'Voting is not active'
    });
  } catch (error) {
    console.error('Error fetching election status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch election status' },
      { status: 500 }
    );
  }
}