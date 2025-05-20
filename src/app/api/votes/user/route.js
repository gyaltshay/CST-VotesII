import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/config/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const votes = await prisma.vote.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            positionId: true,
            position: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new Response(JSON.stringify({ votes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user votes:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch votes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 