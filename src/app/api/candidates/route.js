import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/config/auth';
import prisma from '@/lib/prisma';
import { logAction } from '@/lib/audit';

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
  const startTime = Date.now();
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map candidates to include position details
    const candidatesWithPositions = candidates.map(candidate => ({
      ...candidate,
      position: DEFAULT_POSITIONS[candidate.positionId] || { 
        id: candidate.positionId,
        title: 'Unknown Position',
        description: 'Position details not available'
      }
    }));

    return NextResponse.json({ candidates: candidatesWithPositions });
  } catch (error) {
    console.error('Error fetching candidates:', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.role === 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, studentId, department, gender, manifesto, imageUrl, positionId } = data;

    // Validate required fields
    if (!name || !studentId || !department || !gender || !positionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { studentId },
    });

    if (existingCandidate) {
      return NextResponse.json({ error: 'Candidate already exists' }, { status: 400 });
    }

    // Create new candidate
    const candidate = await prisma.candidate.create({
      data: {
        name,
        studentId,
        department,
        gender,
        manifesto: manifesto || '',
        imageUrl,
        positionId,
      },
    });

    // Create audit log
    await logAction({
      action: 'CREATE_CANDIDATE',
      entityType: 'CANDIDATE',
      entityId: candidate.id,
      userId: session.user.id,
      metadata: {
        name,
        studentId,
        department,
        gender,
        positionId,
        duration: Date.now() - startTime
      }
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error creating candidate:', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.role === 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, name, department, gender, manifesto, imageUrl, positionId } = data;

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        name,
        department,
        gender,
        manifesto,
        imageUrl,
        positionId,
      },
    });

    await logAction({
      action: 'UPDATE_CANDIDATE',
      entityType: 'CANDIDATE',
      entityId: candidate.id,
      userId: session.user.id,
      metadata: {
        name,
        department,
        gender,
        positionId,
        duration: Date.now() - startTime
      }
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.role === 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const candidate = await prisma.candidate.delete({
      where: { id },
    });

    await logAction({
      action: 'DELETE_CANDIDATE',
      entityType: 'CANDIDATE',
      entityId: candidate.id,
      userId: session.user.id,
      metadata: {
        name: candidate.name,
        studentId: candidate.studentId,
        duration: Date.now() - startTime
      }
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error deleting candidate:', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}