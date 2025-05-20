import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
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
    const response = NextResponse.json({
      election: {
        id: activeElection.id,
        startTime: activeElection.votingStartTime,
        endTime: activeElection.votingEndTime,
        isActive: activeElection.isActive
      },
      results
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
    console.error('Results fetch error:', error);
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
    return NextResponse.json(
      { error: error.message || 'Failed to fetch results' },
      { status: 500 }
    );
  }
} 