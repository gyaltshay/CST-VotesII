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

// GET /api/admin/users
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
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access. Admin privileges required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    // Validate request parameters
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

    if (filter !== 'all' && !['STUDENT', 'ADMIN'].includes(filter.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid filter value' },
        { status: 400 }
      );
    }

    // Build where clause based on filter and search
    const where = {
      ...(filter !== 'all' && { role: filter.toUpperCase() }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { studentId: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        department: true,
        yearOfStudy: true,
        gender: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            votes: true,
            twoFactorCodes: true,
            reminderLogs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const response = NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages
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
      status: 200,
      filter,
      search,
      page,
      limit
    });

    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    
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
      { error: 'Failed to fetch users. Please try again later.' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            votes: true,
            twoFactorCodes: true,
            reminderLogs: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin users
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      );
    }

    // Delete related records first
    await prisma.$transaction([
      // Delete votes
      prisma.vote.deleteMany({
        where: { userId: id }
      }),
      // Delete two factor codes
      prisma.twoFactorCode.deleteMany({
        where: { userId: id }
      }),
      // Delete reminder logs
      prisma.reminderLog.deleteMany({
        where: { userId: id }
      }),
      // Delete sessions
      prisma.session.deleteMany({
        where: { userId: id }
      }),
      // Delete accounts
      prisma.account.deleteMany({
        where: { userId: id }
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 