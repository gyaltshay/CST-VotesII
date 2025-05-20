import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total users (students only)
    const totalUsers = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total votes
    const totalVotes = await prisma.vote.count();

    return NextResponse.json({
      totalUsers,
      totalVotes
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 