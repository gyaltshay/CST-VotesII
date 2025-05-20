import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const page = parseInt(req.nextUrl.searchParams.get('page')) || 1;
    const limit = parseInt(req.nextUrl.searchParams.get('limit')) || 10;
    const userId = req.nextUrl.searchParams.get('userId');
    const action = req.nextUrl.searchParams.get('action');

    const where = {
      ...(userId && { userId }),
      ...(action && { action }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return new Response(JSON.stringify({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}