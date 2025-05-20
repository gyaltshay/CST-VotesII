import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache duration in seconds
const CACHE_DURATION = 60; // 1 minute

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
};

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

// Simple in-memory rate limiting
const requestCounts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;
  
  // Clean up old entries
  for (const [key, timestamp] of requestCounts.entries()) {
    if (timestamp < windowStart) {
      requestCounts.delete(key);
    }
  }
  
  // Count requests in current window
  const count = Array.from(requestCounts.entries())
    .filter(([key, timestamp]) => key.startsWith(ip) && timestamp > windowStart)
    .length;
  
  if (count >= RATE_LIMIT.maxRequests) {
    return true;
  }
  
  // Add new request
  requestCounts.set(`${ip}-${now}`, now);
  return false;
}

export async function GET(request) {
  const startTime = Date.now();
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  
  try {
    // Rate limiting check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate request
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const positionId = searchParams.get('positionId');

    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit value. Must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (positionId && !DEFAULT_POSITIONS[positionId]) {
      return NextResponse.json(
        { error: 'Invalid position ID' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 401 }
      );
    }

    // Get all candidates with their votes
    const candidates = await prisma.candidate.findMany({
      where: positionId ? { positionId } : undefined,
      include: {
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: {
        voteCount: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count for pagination
    const totalCandidates = await prisma.candidate.count({
      where: positionId ? { positionId } : undefined
    });

    // Get total number of voters
    const totalVoters = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total number of votes cast
    const totalVotes = await prisma.vote.count();

    // Get election status
    const status = await prisma.electionStatus.findFirst();

    if (!status) {
      return NextResponse.json(
        { error: 'Election status not found' },
        { status: 404 }
      );
    }

    // Get department-wise voter statistics
    const departmentVoterStats = await prisma.user.groupBy({
      by: ['department'],
      where: { role: 'STUDENT' },
      _count: true
    });

    // Get gender-wise voter statistics
    const genderVoterStats = await prisma.user.groupBy({
      by: ['gender'],
      where: { role: 'STUDENT' },
      _count: true
    });

    // Get department-wise vote statistics
    const departmentVoteStats = await prisma.vote.groupBy({
      by: ['candidate.department'],
      _count: true
    });

    // Get gender-wise vote statistics
    const genderVoteStats = await prisma.vote.groupBy({
      by: ['candidate.gender'],
      _count: true
    });

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

    const response = NextResponse.json({
      results: resultsByPosition,
      winners,
      statistics: {
        totalVoters,
        totalVotes,
        voterTurnout: totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0,
        departmentStats: {
          voters: departmentVoterStats,
          votes: departmentVoteStats
        },
        genderStats: {
          voters: genderVoterStats,
          votes: genderVoteStats
        }
      },
      electionStatus: status,
      pagination: {
        page,
        limit,
        totalCandidates,
        totalPages: Math.ceil(totalCandidates / limit)
      }
    });

    // Add cache headers
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`);
    
    // Add compression
    response.headers.set('Content-Encoding', 'gzip');
    
    // Log request details
    console.log({
      timestamp: new Date().toISOString(),
      ip,
      method: 'GET',
      path: request.url,
      duration: Date.now() - startTime,
      status: 200
    });

    return response;
  } catch (error) {
    console.error('Error fetching election results:', error);
    
    // Log error details
    console.error({
      timestamp: new Date().toISOString(),
      ip,
      method: 'GET',
      path: request.url,
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack
    });
    
    // Provide more detailed error messages based on the error type
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Database constraint violation' },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch election results. Please try again later.' },
      { status: 500 }
    );
  }
} 