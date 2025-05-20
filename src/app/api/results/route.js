import { NextResponse } from 'next/server';
import prisma from '@/config/db';
import { checkDBConnection } from '@/config/db';

export async function GET() {
  try {
    // Check database connection first
    const isConnected = await checkDBConnection();
    if (!isConnected) {
      console.error('Database connection failed');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    console.log('Fetching candidates...');
    // Get all candidates with their votes
    const candidates = await prisma.candidate.findMany({
      include: {
        votes: {
          include: {
            user: {
              select: {
                department: true
              }
            }
          }
        }
      }
    });
    console.log(`Found ${candidates.length} candidates`);

    console.log('Fetching total voters...');
    // Get total number of voters
    const totalVoters = await prisma.user.count({
      where: {
        role: 'voter'
      }
    });
    console.log(`Total voters: ${totalVoters}`);

    console.log('Fetching election settings...');
    // Get election settings
    const election = await prisma.electionSettings.findFirst({
      where: {
        isActive: true
      }
    });
    console.log('Election settings:', election ? 'Found' : 'Not found');

    // Process all candidates' results
    const processedCandidates = candidates.map(candidate => {
      // Calculate department-wise votes
      const departmentStats = candidate.votes.reduce((acc, vote) => {
        const dept = vote.user?.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      return {
        id: candidate.id,
        name: candidate.name,
        department: candidate.department,
        imageUrl: candidate.imageUrl,
        voteCount: candidate.votes.length,
        departmentStats
      };
    });

    // Calculate total votes across all candidates
    const totalVotes = processedCandidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);
    console.log(`Total votes: ${totalVotes}`);

    return NextResponse.json({
      candidates: processedCandidates,
      totalVotes,
      totalVoters,
      election: election ? {
        isActive: election.isActive,
        startTime: election.votingStartTime,
        endTime: election.votingEndTime
      } : null
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    // Log more detailed error information
    if (error.code) {
      console.error('Database error code:', error.code);
    }
    if (error.meta) {
      console.error('Database error metadata:', error.meta);
    }
    return NextResponse.json(
      { error: 'Failed to fetch results', details: error.message },
      { status: 500 }
    );
  }
} 