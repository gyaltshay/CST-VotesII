import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in your environment.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, email, password, department, yearOfStudy, gender } = body;

    if (!studentId || !email || !password || !department || !yearOfStudy || !gender) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { studentId: studentId },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this student ID or email already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        studentId,
        email,
        name: `Student ${studentId}`,
        password: hashedPassword,
        department,
        yearOfStudy: parseInt(yearOfStudy),
        gender: gender === 'Male' ? 'Male' : 'Female',
        role: 'STUDENT'
      }
    });

    // Generate verification token
    const verificationToken = jwt.sign(
      { email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);

    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false,
          message: 'This student ID or email is already registered'
        },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false,
          message: error.message
        },
        { status: 400 }
      );
    }

    // Handle all other errors
    return NextResponse.json(
      { 
        success: false,
        message: 'An error occurred during registration. Please try again.'
      },
      { status: 500 }
    );
  }
}