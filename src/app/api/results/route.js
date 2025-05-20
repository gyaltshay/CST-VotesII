import { NextResponse } from 'next/server';
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
    // Get total number of voters
    const totalVoters = await prisma.user.count({
      where: {
        role: 'STUDENT'
      }
    });
    // Get election status
    const election = await prisma.electionStatus.findFirst();
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
    const response = NextResponse.json({
      candidates: processedCandidates,
      totalVotes,
      totalVoters,
      election: election ? {
        isActive: election.isActive,
        startTime: election.startTime,
        endTime: election.endTime
      } : null
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
    console.error('Error fetching results:', error);
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
      { error: 'Failed to fetch results', details: error.message },
      { status: 500 }
    );
  }
} 