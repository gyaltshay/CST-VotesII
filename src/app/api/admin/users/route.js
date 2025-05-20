import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/admin/users
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

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
      skip,
      take: limit
    });

    return NextResponse.json({
      users,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
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