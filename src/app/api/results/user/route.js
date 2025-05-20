import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get active election
    const activeElection = await prisma.electionSettings.findFirst({
      where: { isActive: true }
    });

    if (!activeElection) {
      return NextResponse.json(
        { error: 'No active election' },
        { status: 400 }
      );
    }

    // Get all positions with their candidates and votes
    const positions = await prisma.position.findMany({
      where: { isActive: true },
      include: {
        candidates: {
          include: {
            _count: {
              select: { votes: true }
            }
          },
          orderBy: {
            voteCount: 'desc'
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    // Process results
    const results = positions.map(position => {
      const totalVotes = position.candidates.reduce(
        (sum, candidate) => sum + candidate._count.votes,
        0
      );

      return {
        position: {
          id: position.id,
          name: position.name,
          totalSeats: position.totalSeats,
          maleSeats: position.maleSeats,
          femaleSeats: position.femaleSeats
        },
        candidates: position.candidates.map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          department: candidate.department,
          gender: candidate.gender,
          voteCount: candidate._count.votes,
          votePercentage: totalVotes > 0 
            ? ((candidate._count.votes / totalVotes) * 100).toFixed(1)
            : 0
        })),
        totalVotes,
        departmentStats: position.candidates.reduce((stats, candidate) => {
          stats[candidate.department] = (stats[candidate.department] || 0) + candidate._count.votes;
          return stats;
        }, {})
      };
    });

    return NextResponse.json({
      election: {
        id: activeElection.id,
        startTime: activeElection.votingStartTime,
        endTime: activeElection.votingEndTime,
        isActive: activeElection.isActive
      },
      results
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch results' },
      { status: 500 }
    );
  }
} 