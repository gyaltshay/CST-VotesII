import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current active election settings
    const currentSettings = await prisma.electionSettings.findFirst({
      where: { isActive: true }
    });

    if (!currentSettings) {
      return NextResponse.json(
        { error: 'No active election found' },
        { status: 400 }
      );
    }

    // Get election results
    const results = await prisma.candidate.findMany({
      include: {
        position: true,
        _count: {
          select: { votes: true }
        }
      }
    });

    // Create archive entry
    await prisma.electionArchive.create({
      data: {
        electionId: currentSettings.id,
        startTime: currentSettings.votingStartTime,
        endTime: currentSettings.votingEndTime,
        results: results.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          position: candidate.position.name,
          votes: candidate._count.votes
        }))
      }
    });

    // Deactivate current election
    await prisma.electionSettings.update({
      where: { id: currentSettings.id },
      data: { isActive: false }
    });

    // Reset vote counts
    await prisma.candidate.updateMany({
      data: { voteCount: 0 }
    });

    // Clear all votes
    await prisma.vote.deleteMany({});

    return NextResponse.json({ message: 'Election archived successfully' });
  } catch (error) {
    console.error('Failed to archive election:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 