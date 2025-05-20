import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    
    const elections = await prisma.election.findMany({
      where: {
        startDate: {
          lte: now
        },
        endDate: {
          gte: now
        },
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        positions: {
          select: {
            id: true,
            title: true,
            candidates: {
              select: {
                id: true,
                name: true,
                department: true,
                gender: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ elections });
  } catch (error) {
    console.error('Error fetching active elections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active elections' },
      { status: 500 }
    );
  }
} 