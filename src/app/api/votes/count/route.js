import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const position = req.nextUrl.searchParams.get('position');
    const department = req.nextUrl.searchParams.get('department');

    const whereClause = {
      ...(position && { position: { name: position } }),
      candidate: {
        ...(department && { department }),
      },
    };

    const results = await prisma.vote.groupBy({
      by: ['candidateId'],
      where: whereClause,
      _count: true,
      orderBy: {
        _count: {
          candidateId: 'desc',
        },
      },
    });

    const candidateDetails = await prisma.candidate.findMany({
      where: {
        id: {
          in: results.map(r => r.candidateId),
        },
      },
      include: {
        position: true,
      },
    });

    const formattedResults = results.map(result => {
      const candidate = candidateDetails.find(c => c.id === result.candidateId);
      return {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          department: candidate.department,
          position: candidate.position.name,
          gender: candidate.gender,
          imageUrl: candidate.imageUrl,
        },
        votes: result._count,
      };
    });

    return new Response(JSON.stringify({
      results: formattedResults,
      totalVotes: formattedResults.reduce((sum, r) => sum + r.votes, 0),
      lastUpdated: new Date(),
    }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}