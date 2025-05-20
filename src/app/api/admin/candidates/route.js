import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_POSITIONS = {
  chief_councillor: { title: 'Chief Councillor', maleSeats: 1, femaleSeats: 1 },
  deputy_chief_councillor: { title: 'Deputy Chief Councillor', maleSeats: 1, femaleSeats: 1 },
  games_health_councillor: { title: 'Games and Health Councillor', maleSeats: 1, femaleSeats: 1 },
  block_councillor: { title: 'Block Councillor', maleSeats: 1, femaleSeats: 1 },
  cultural_councillor: { title: 'Cultural Councillor', maleSeats: 1, femaleSeats: 1 },
  college_academic_councillor: { title: 'College Academic Councillor', maleSeats: 1, femaleSeats: 1 }
};

// GET /api/admin/candidates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const candidates = await prisma.candidate.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map candidates to include position details
    const candidatesWithPositions = candidates.map(candidate => ({
      ...candidate,
      position: DEFAULT_POSITIONS[candidate.positionId] || { title: 'Unknown Position' }
    }));

    return NextResponse.json({ candidates: candidatesWithPositions });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/candidates
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { name, studentId, positionId, department, gender, manifesto, imageUrl } = data;

    // Validate required fields
    if (!name || !studentId || !positionId || !department || !gender || !manifesto) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate position
    if (!DEFAULT_POSITIONS[positionId]) {
      return NextResponse.json(
        { error: 'Invalid position' },
        { status: 400 }
      );
    }

    // Check if candidate with same studentId already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { studentId }
    });

    if (existingCandidate) {
      return NextResponse.json(
        { error: 'A candidate with this student ID already exists' },
        { status: 400 }
      );
    }

    // Check gender quota for the position
    const position = DEFAULT_POSITIONS[positionId];
    const genderCount = await prisma.candidate.count({
      where: {
        positionId,
        gender
      }
    });

    const maxSeats = gender === 'Male' ? position.maleSeats : position.femaleSeats;
    if (genderCount >= maxSeats) {
      return NextResponse.json(
        { error: `Maximum number of ${gender} candidates reached for this position` },
        { status: 400 }
      );
    }

    // Create new candidate
    const candidate = await prisma.candidate.create({
      data: {
        name,
        studentId,
        positionId,
        department,
        gender,
        manifesto,
        imageUrl: imageUrl || null,
        voteCount: 0
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'CANDIDATE_CREATE',
        entityType: 'CANDIDATE',
        entityId: candidate.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/candidates
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
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Delete candidate and their votes
    await prisma.$transaction([
      // First delete all votes for this candidate
      prisma.vote.deleteMany({
        where: { candidateId: id }
      }),
      // Then delete the candidate
      prisma.candidate.delete({
        where: { id }
      })
    ]);

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'CANDIDATE_DELETE',
        entityType: 'CANDIDATE',
        entityId: id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    );
  }
} 