import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/config/auth';
import prisma from '@/lib/prisma';
import { logAction } from '@/lib/audit';
import { sendVerificationCode, validatePhoneNumber, isRateLimited } from '@/lib/sms';

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { phoneNumber, type } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    let message;
    let code;

    switch (type) {
      case '2FA_SETUP':
        code = Math.floor(100000 + Math.random() * 900000).toString();
        message = `Your CST Votes verification code is: ${code}`;
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phoneNumber,
            twoFactorTemp: code,
          },
        });
        break;

      case 'VOTE_CONFIRMATION':
        message = 'Thank you for voting in the CST Student Council Election. Your vote has been recorded successfully.';
        break;

      case 'PASSWORD_RESET':
        code = Math.floor(100000 + Math.random() * 900000).toString();
        message = `Your CST Votes password reset code is: ${code}. This code will expire in 10 minutes.`;
        
        await prisma.user.update({
          where: { id: user.id },
          data: { resetPasswordToken: code },
        });
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid message type' }), {
          status: 400,
        });
    }

    await sendVerificationCode(phoneNumber, message);

    await logAction({
      action: 'SEND_SMS',
      userId: user.id,
      details: {
        type,
        phoneNumber,
        timestamp: new Date(),
      },
    });

    return new Response(JSON.stringify({ 
      message: 'SMS sent successfully',
      code: type === '2FA_SETUP' || type === 'PASSWORD_RESET' ? code : undefined,
    }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}