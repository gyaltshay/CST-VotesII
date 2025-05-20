import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/election-status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const status = await prisma.electionStatus.findFirst();
    
    if (!status) {
      return NextResponse.json({
        isActive: false,
        startTime: null,
        endTime: null
      });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching election status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch election status' },
      { status: 500 }
    );
  }
}

// POST /api/admin/election-status
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { isActive, startTime, endTime } = data;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    if (startTime && !isValidDate(startTime)) {
      return NextResponse.json(
        { error: 'Invalid start time' },
        { status: 400 }
      );
    }

    if (endTime && !isValidDate(endTime)) {
      return NextResponse.json(
        { error: 'Invalid end time' },
        { status: 400 }
      );
    }

    // Update or create election status
    const status = await prisma.electionStatus.upsert({
      where: { id: 1 }, // Assuming we only have one election status record
      update: {
        isActive,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined
      },
      create: {
        id: 1,
        isActive,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'ELECTION_STATUS_UPDATE',
        entityType: 'ELECTION_STATUS',
        entityId: status.id,
        userId: session.user.id,
        metadata: {
          isActive,
          startTime,
          endTime
        }
      }
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error updating election status:', error);
    return NextResponse.json(
      { error: 'Failed to update election status' },
      { status: 500 }
    );
  }
}

// Helper function to validate date strings
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
} 