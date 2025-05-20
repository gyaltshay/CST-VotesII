import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/sms';
import { generateOTP, verifyOTP } from '@/lib/twoFactor';

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { action, code, phoneNumber } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      });
    }

    switch (action) {
      case 'enable':
        if (user.twoFactorAuth) {
          return new Response(JSON.stringify({ error: '2FA already enabled' }), {
            status: 400,
          });
        }

        const otp = generateOTP();
        await sendSMS(phoneNumber, `Your CST Votes verification code is: ${otp}`);
        
        // Store OTP temporarily (in production, use Redis or similar)
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            phoneNumber,
            twoFactorTemp: otp,
          },
        });

        return new Response(JSON.stringify({ message: 'OTP sent' }), {
          status: 200,
        });

      case 'verify':
        if (!verifyOTP(code, user.twoFactorTemp)) {
          return new Response(JSON.stringify({ error: 'Invalid code' }), {
            status: 400,
          });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { 
            twoFactorAuth: true,
            twoFactorTemp: null,
          },
        });

        return new Response(JSON.stringify({ message: '2FA enabled successfully' }), {
          status: 200,
        });

      case 'disable':
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            twoFactorAuth: false,
            phoneNumber: null,
          },
        });

        return new Response(JSON.stringify({ message: '2FA disabled successfully' }), {
          status: 200,
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}