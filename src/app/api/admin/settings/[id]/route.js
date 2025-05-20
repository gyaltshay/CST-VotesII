import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if the setting exists
    const setting = await prisma.electionSettings.findUnique({
      where: { id }
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    // Delete the setting
    await prisma.electionSettings.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Failed to delete setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 