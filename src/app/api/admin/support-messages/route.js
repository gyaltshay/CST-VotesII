import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

// Get support messages with pagination and filtering
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        // Build where clause
        const where = {
            ...(status && { status }),
            ...(search && {
                OR: [
                    { subject: { contains: search, mode: 'insensitive' } },
                    { message: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            })
        };

        // Get total count for pagination
        const total = await prisma.supportMessage.count({ where });

        // Get messages with pagination
        const messages = await prisma.supportMessage.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });

        return NextResponse.json({
            messages,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page
            }
        });
    } catch (error) {
        console.error('Failed to fetch support messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch support messages. Please try again later.' },
            { status: 500 }
        );
    }
}

// Update support message status
export async function PATCH(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json(
                { error: 'Message ID and status are required' },
                { status: 400 }
            );
        }

        const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status value' },
                { status: 400 }
            );
        }

        const message = await prisma.supportMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            );
        }

        const updatedMessage = await prisma.supportMessage.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({
            message: 'Status updated successfully',
            data: updatedMessage
        });
    } catch (error) {
        console.error('Failed to update support message:', error);
        return NextResponse.json(
            { error: 'Failed to update message status. Please try again later.' },
            { status: 500 }
        );
    }
} 