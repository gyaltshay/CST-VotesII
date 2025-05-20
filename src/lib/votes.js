import { PrismaClient } from '@prisma/client';
import { validateVotingLimits } from './positions';
import { sendVoteConfirmationEmail } from './email';
import { sendVoteConfirmationSMS } from '@/config/sms';
import { logAction } from './audit';

const prisma = new PrismaClient();

export async function castVote(userId, candidateId) {
  return await prisma.$transaction(async (tx) => {
    // Get candidate and user details
    const candidate = await tx.candidate.findUnique({
      where: { id: candidateId },
      include: { position: true }
    });

    const user = await tx.user.findUnique({
      where: { id: userId }
    });

    if (!candidate || !user) {
      throw new Error('Invalid candidate or user');
    }

    // Validate voting limits
    const { canVote } = await validateVotingLimits(
      userId,
      candidate.positionId,
      candidate.gender
    );

    if (!canVote) {
      throw new Error('Voting limit reached for this position or gender');
    }

    // Record vote
    const vote = await tx.vote.create({
      data: {
        userId,
        candidateId
      }
    });

    // Update candidate vote count
    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        voteCount: {
          increment: 1
        }
      }
    });

    // Send confirmations
    try {
      await Promise.all([
        sendVoteConfirmationEmail(user, candidate.position.name, candidate.name),
        sendVoteConfirmationSMS(user.phone, candidate.position.name)
      ]);
    } catch (error) {
      console.error('Failed to send vote confirmation:', error);
    }

    // Log the action
    await logAction(
      'VOTE_CAST',
      'VOTE',
      vote.id,
      userId,
      {
        candidateId,
        position: candidate.position.name
      }
    );

    return vote;
  });
}

export async function getVotingResults(includeArchived = false) {
  const currentResults = await prisma.candidate.findMany({
    include: {
      position: true,
      _count: {
        select: { votes: true }
      }
    },
    orderBy: [
      { position: { displayOrder: 'asc' } },
      { voteCount: 'desc' }
    ]
  });

  let results = currentResults.reduce((acc, candidate) => {
    if (!acc[candidate.position.name]) {
      acc[candidate.position.name] = [];
    }
    acc[candidate.position.name].push({
      id: candidate.id,
      name: candidate.name,
      voteCount: candidate._count.votes,
      department: candidate.department,
      gender: candidate.gender
    });
    return acc;
  }, {});

  if (includeArchived) {
    const archivedResults = await prisma.electionArchive.findMany({
      orderBy: { endTime: 'desc' }
    });
    results.archived = archivedResults;
  }

  return results;
}