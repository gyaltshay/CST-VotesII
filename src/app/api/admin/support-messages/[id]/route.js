import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH endpoint to update support message status
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.isAdmin) {
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
        console.error('Error updating support message:', error);
        return NextResponse.json(
            { message: 'Failed to update support message' },
            { status: 500 }
        );
    }
} 