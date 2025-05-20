import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const elections = await prisma.election.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        positions: {
          select: {
            id: true,
            title: true,
            departmentQuota: true,
            genderQuota: true,
            candidates: {
              select: {
                id: true,
                name: true,
                department: true,
                gender: true,
                votes: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Process results to include vote counts and statistics
    const processedElections = elections.map(election => ({
      ...election,
      positions: election.positions.map(position => {
        const totalVotes = position.candidates.reduce((sum, candidate) => sum + candidate.votes.length, 0);
        const departmentVotes = {};
        const genderVotes = {};

        position.candidates.forEach(candidate => {
          // Count department votes
          departmentVotes[candidate.department] = (departmentVotes[candidate.department] || 0) + candidate.votes.length;
          // Count gender votes
          genderVotes[candidate.gender] = (genderVotes[candidate.gender] || 0) + candidate.votes.length;
        });

        return {
          ...position,
          totalVotes,
          departmentVotes,
          genderVotes,
          candidates: position.candidates.map(candidate => ({
            ...candidate,
            voteCount: candidate.votes.length,
            votePercentage: totalVotes > 0 ? (candidate.votes.length / totalVotes * 100).toFixed(1) : 0,
            votes: undefined // Remove the votes array from the response
          }))
        };
      })
    }));

    return NextResponse.json({ elections: processedElections });
  } catch (error) {
    console.error('Error fetching election results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch election results' },
      { status: 500 }
    );
  }
} 