import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/config/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await getServerSession(authConfig);
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function GET(request, { params }) {
  const startTime = Date.now();
  try {
    await checkAdminAuth();
    const { id } = params;

    const setting = await prisma.electionSettings.findUnique({
      where: { id }
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Failed to get setting:', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const startTime = Date.now();
  try {
    await checkAdminAuth();
    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Check if the setting exists
    const existingSetting = await prisma.electionSettings.findUnique({
      where: { id }
    });

    if (!existingSetting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    // Update the setting
    const updatedSetting = await prisma.electionSettings.update({
      where: { id },
      data: body
    });

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error('Failed to update setting:', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const startTime = Date.now();
  try {
    await checkAdminAuth();
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
    console.error('Failed to delete setting:', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 