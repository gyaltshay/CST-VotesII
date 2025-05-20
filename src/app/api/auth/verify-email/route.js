import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in your environment.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('Verification attempt with token:', token);

    if (!token) {
      console.log('No token provided');
      return NextResponse.json(
        { message: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email } = decoded;
    
    console.log('Token decoded for email:', email);

    // Find user first
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url));
    }

    console.log('Found user:', user.id);

    // Update user's email verification status
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    });

    console.log('User verified:', updatedUser.id);

    // Redirect to login page with success message
    return NextResponse.redirect(new URL('/login?verified=true', request.url));

  } catch (error) {
    console.error('Email verification error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }
}