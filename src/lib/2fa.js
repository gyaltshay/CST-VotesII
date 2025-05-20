import prisma from './prisma';
import { sendVerificationEmail } from './email';

export async function generateTwoFactorCode(userId) {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store the code in the database
  await prisma.twoFactorCode.create({
    data: {
      userId,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  return code;
}

export async function verifyTwoFactorCode(userId, code) {
  const twoFactorCode = await prisma.twoFactorCode.findFirst({
    where: {
      userId,
      code,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!twoFactorCode) {
    throw new Error('Invalid or expired verification code');
  }

  // Mark the code as used
  await prisma.twoFactorCode.update({
    where: { id: twoFactorCode.id },
    data: { used: true },
  });

  return true;
}

export async function sendTwoFactorCode(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const code = await generateTwoFactorCode(userId);
  await sendVerificationEmail(user.email, code);

  return true;
} 