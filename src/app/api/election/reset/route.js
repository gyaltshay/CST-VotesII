import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { keepCandidates } = await req.json();

    // Begin transaction
    await prisma.$transaction(async (tx) => {
      // Delete all votes
      await tx.vote.deleteMany({});

      if (!keepCandidates) {
        // Delete all candidates
        await tx.candidate.deleteMany({});
      }

      // Log the action
      await logAudit({
        action: 'ELECTION_RESET',
        userId: session.user.id,
        details: {
          keepCandidates,
          timestamp: new Date(),
        },
      });
    });

    return new Response(JSON.stringify({ 
      message: 'Election reset successfully' 
    }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}