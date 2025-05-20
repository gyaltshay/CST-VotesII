import { PrismaClient } from '@prisma/client';
import { logAction } from '@/lib/audit';

const prisma = new PrismaClient();

export async function resetElection() {
  const session = await prisma.$transaction(async (tx) => {
    try {
      // Archive current election results
      const currentElection = await tx.electionSettings.findFirst({
        where: { isActive: true }
      });

      if (currentElection) {
        // Get all votes for archiving
        const votes = await tx.vote.findMany({
          include: {
            candidate: true,
            user: {
              select: {
                department: true,
                gender: true
              }
            }
          }
        });

        // Create archive record
        await tx.electionArchive.create({
          data: {
            electionId: currentElection.id,
            startTime: currentElection.votingStartTime,
            endTime: currentElection.votingEndTime,
            results: JSON.stringify(votes),
            metadata: JSON.stringify({
              totalVotes: votes.length,
              departmentStats: votes.reduce((acc, vote) => {
                acc[vote.user.department] = (acc[vote.user.department] || 0) + 1;
                return acc;
              }, {}),
              genderStats: votes.reduce((acc, vote) => {
                acc[vote.user.gender] = (acc[vote.user.gender] || 0) + 1;
                return acc;
              }, {})
            })
          }
        });

        // Reset votes
        await tx.vote.deleteMany();

        // Reset candidate votes count
        await tx.candidate.updateMany({
          data: {
            voteCount: 0
          }
        });

        // Deactivate current election
        await tx.electionSettings.update({
          where: { id: currentElection.id },
          data: { isActive: false }
        });

        // Log the reset action
        await logAction(
          'ELECTION_RESET',
          'SYSTEM',
          null,
          null,
          {
            electionId: currentElection.id,
            archivedAt: new Date()
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to reset election:', error);
      throw error;
    }
  });

  return session;
}