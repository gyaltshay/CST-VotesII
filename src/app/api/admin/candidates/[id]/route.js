import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// DELETE /api/admin/candidates/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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
    console.error('Failed to delete candidate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 