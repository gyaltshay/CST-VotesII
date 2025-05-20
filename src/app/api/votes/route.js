import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/config/db';
import { authOptions } from '../auth/[...nextauth]/route';
import { sendVoteConfirmationEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please login to vote' },
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

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Get the current user
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          votes: {
            include: {
              candidate: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get the candidate
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId }
      });

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Check if election is active
      const activeElection = await prisma.electionSettings.findFirst({
        where: { isActive: true }
      });

      if (!activeElection) {
        throw new Error('No active election');
      }

      const now = new Date();
      if (now < activeElection.votingStartTime || now > activeElection.votingEndTime) {
        throw new Error('Voting is not currently active');
      }

      // Check if user has already voted for this position
      const existingVote = user.votes.find(
        vote => vote.candidate.positionId === candidate.positionId
      );

      if (existingVote) {
        throw new Error('You have already voted for this position');
      }

      // Create the vote
      const vote = await prisma.vote.create({
        data: {
          userId: user.id,
          candidateId: candidate.id
        },
        include: {
          candidate: true
        }
      });

      // Update candidate vote count
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          voteCount: {
            increment: 1
          }
        }
      });

      // Send confirmation email
      try {
        await sendVoteConfirmationEmail(
          user.email,
          candidate.name,
          candidate.positionId // Using positionId as the position name
        );
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw error here as the vote was already recorded
      }

      // Log the vote
      await prisma.auditLog.create({
        data: {
          action: 'VOTE_CAST',
          entityType: 'VOTE',
          entityId: vote.id,
          userId: user.id,
          metadata: {
            candidateId: candidate.id,
            positionId: candidate.positionId,
            department: user.department
          }
        }
      });

      return vote;
    });

    return NextResponse.json({
      message: 'Vote recorded successfully',
      vote: result
    });
  } catch (error) {
    console.error('Failed to record vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record vote. Please try again later.' },
      { status: 400 }
    );
  }
}