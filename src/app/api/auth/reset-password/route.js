import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in your environment.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email, id } = decoded;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user || user.email !== email) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Password updated successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid or expired reset token'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred while resetting your password'
      },
      { status: 500 }
    );
  }
} 