import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_POSITIONS = {
  chief_councillor: { 
    id: 'chief_councillor',
    title: 'Chief Councillor',
    description: 'Lead the student body and represent student interests',
    maleSeats: 1,
    femaleSeats: 1
  },
  deputy_chief_councillor: { 
    id: 'deputy_chief_councillor',
    title: 'Deputy Chief Councillor',
    description: 'Support the Chief Councillor and oversee student activities',
    maleSeats: 1,
    femaleSeats: 1
  },
  games_health_councillor: { 
    id: 'games_health_councillor',
    title: 'Games and Health Councillor',
    description: 'Oversee sports activities and health initiatives',
    maleSeats: 1,
    femaleSeats: 1
  },
  block_councillor: { 
    id: 'block_councillor',
    title: 'Block Councillor',
    description: 'Manage block-level activities and concerns',
    maleSeats: 1,
    femaleSeats: 1
  },
  cultural_councillor: { 
    id: 'cultural_councillor',
    title: 'Cultural Councillor',
    description: 'Organize cultural events and promote diversity',
    maleSeats: 1,
    femaleSeats: 1
  },
  college_academic_councillor: { 
    id: 'college_academic_councillor',
    title: 'College Academic Councillor',
    description: 'Represent academic interests and concerns',
    maleSeats: 1,
    femaleSeats: 1
  }
};

export async function GET() {
  try {
    // Check if election has ended
    const status = await prisma.electionStatus.findFirst();
    if (!status || status.isActive) {
      return NextResponse.json(
        { error: 'Results are not available yet' },
        { status: 403 }
      );
    }

    const now = new Date();
    if (status.endTime && now < new Date(status.endTime)) {
      return NextResponse.json(
        { error: 'Results will be available after the election ends' },
        { status: 403 }
      );
    }

    // Get all candidates with their votes
    const candidates = await prisma.candidate.findMany({
      include: {
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: {
        voteCount: 'desc'
      }
    });

    // Get total number of voters
    const totalVoters = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total number of votes cast
    const totalVotes = await prisma.vote.count();

    // Group candidates by position
    const resultsByPosition = candidates.reduce((acc, candidate) => {
      const position = DEFAULT_POSITIONS[candidate.positionId];
      if (!position) return acc;

      if (!acc[position.id]) {
        acc[position.id] = {
          position,
          candidates: []
        };
      }

      acc[position.id].candidates.push({
        id: candidate.id,
        name: candidate.name,
        department: candidate.department,
        gender: candidate.gender,
        voteCount: candidate._count.votes,
        imageUrl: candidate.imageUrl
      });

      return acc;
    }, {});

    // Sort candidates within each position by vote count
    Object.values(resultsByPosition).forEach(position => {
      position.candidates.sort((a, b) => b.voteCount - a.voteCount);
    });

    // Calculate winners for each position
    const winners = {};
    Object.entries(resultsByPosition).forEach(([positionId, data]) => {
      const position = DEFAULT_POSITIONS[positionId];
      const maleCandidates = data.candidates.filter(c => c.gender === 'Male');
      const femaleCandidates = data.candidates.filter(c => c.gender === 'Female');

      winners[positionId] = {
        male: maleCandidates.slice(0, position.maleSeats),
        female: femaleCandidates.slice(0, position.femaleSeats)
      };
    });

    return NextResponse.json({
      results: resultsByPosition,
      winners,
      statistics: {
        totalVoters,
        totalVotes,
        voterTurnout: totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching election results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch election results' },
      { status: 500 }
    );
  }
} 