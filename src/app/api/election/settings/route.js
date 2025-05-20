import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.electionSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching election settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { votingStartTime, votingEndTime, isActive } = data;

    // Validate the data
    if (votingStartTime && votingEndTime) {
      const start = new Date(votingStartTime);
      const end = new Date(votingEndTime);

      if (start >= end) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        );
      }
    }

    // Get current settings or create if not exists
    let settings = await prisma.electionSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!settings) {
      settings = await prisma.electionSettings.create({
        data: {
          votingStartTime: new Date(),
          votingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isActive: false
        }
      });
    }

    // Update settings
    const updatedSettings = await prisma.electionSettings.update({
      where: { id: settings.id },
      data: {
        ...(votingStartTime && { votingStartTime: new Date(votingStartTime) }),
        ...(votingEndTime && { votingEndTime: new Date(votingEndTime) }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating election settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 