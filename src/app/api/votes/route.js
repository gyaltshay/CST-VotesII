import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { sendVoteConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Check if voting is active
    const votingStatus = await prisma.electionStatus.findFirst();
    if (!votingStatus?.isActive) {
      return NextResponse.json(
        { error: 'Voting is not currently active' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startTime = new Date(votingStatus.startTime);
    const endTime = new Date(votingStatus.endTime);

    if (now < startTime) {
      return NextResponse.json(
        { error: `Voting will start at ${startTime.toLocaleString()}` },
        { status: 400 }
      );
    }

    if (now > endTime) {
      return NextResponse.json(
        { error: 'Voting has ended' },
        { status: 400 }
      );
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Check if user has already voted for this position
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: session.user.id,
        candidate: {
          positionId: candidate.positionId
        }
      }
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted for this position' },
        { status: 400 }
      );
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        userId: session.user.id,
        candidateId
      }
    });

    // Update candidate vote count
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        voteCount: {
          increment: 1
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'VOTE_CREATE',
        entityType: 'VOTE',
        entityId: vote.id,
        userId: session.user.id
      }
    });

    // Send confirmation email
    try {
      await sendVoteConfirmationEmail(
        session.user.email,
        candidate.name,
        candidate.positionId // Using positionId as the position name
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't throw error here as the vote was already recorded
    }

    return NextResponse.json({ vote });
  } catch (error) {
    console.error('Error creating vote:', error);
    return NextResponse.json(
      { error: 'Failed to create vote' },
      { status: 500 }
    );
  }
}