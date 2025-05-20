import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { sendEmail } from '@/lib/email';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in your environment.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { email } = await request.json();
    console.log('Received password reset request for:', email);

    // Validate email format
    const emailPattern = /^\d{8}\.cst@rub\.edu\.bt$/;
    if (!emailPattern.test(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists
    console.log('Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.json(
        { success: false, message: 'No account found with this email' },
        { status: 404 }
      );
    }

    console.log('User found, generating reset token...');
    // Generate reset token
    const resetToken = jwt.sign(
      { 
        email: user.email,
        id: user.id 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    console.log('Reset URL generated:', resetUrl);

    try {
      console.log('Attempting to send password reset email...');
      // Send password reset email
      await sendEmail({
        to: email,
        subject: 'Password Reset - CST Votes',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>You have requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #0070f3; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Reset Password
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
        `
      });

      console.log('Password reset email sent successfully');
      return NextResponse.json(
        { 
          success: true,
          message: 'Password reset instructions sent to your email'
        },
        { status: 200 }
      );

    } catch (emailError) {
      console.error('Failed to send password reset email:', {
        error: emailError,
        stack: emailError.stack,
        code: emailError.code
      });
      return NextResponse.json(
        { 
          success: false,
          message: `Failed to send password reset email: ${emailError.message}`
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Password reset error:', {
      error,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      { 
        success: false,
        message: `An error occurred: ${error.message}`
      },
      { status: 500 }
    );
  }
} 