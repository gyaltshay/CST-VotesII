import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/config/auth';
import prisma from '@/lib/prisma';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PATCH endpoint to update support message status
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authConfig);
        
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Unauthorized access' },
                { status: 401 }
            );
        }

        const { id } = params;
        const { status } = await request.json();

        if (!status || !['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
            return NextResponse.json(
                { message: 'Invalid status value' },
                { status: 400 }
            );
        }

        const message = await prisma.supportMessage.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ message });
    } catch (error) {
        console.error('Error updating support message:', { error: error.message, stack: error.stack });
        return NextResponse.json(
            { message: 'Failed to update support message' },
            { status: 500 }
        );
    }
} 