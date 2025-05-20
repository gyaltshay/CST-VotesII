import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/config/auth';
import prisma from '@/config/db';
import { AUTH_ERRORS } from '@/config/constants';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export async function getSession() {
  return getServerSession(authConfig);
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        studentId: true,
        yearOfStudy: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(handler) {
  return async (req, res) => {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: AUTH_ERRORS.NOT_AUTHORIZED });
    }
    
    return handler(req, res, session);
  };
}

export async function requireAdmin(handler) {
  return async (req, res) => {
    const session = await getSession({ req });
    
    if (session?.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: AUTH_ERRORS.NOT_AUTHORIZED });
    }
    
    return handler(req, res, session);
  };
}

export async function generateTwoFactorSecret() {
  const crypto = await import('crypto');
  return crypto.randomBytes(32).toString('hex');
}

export async function verifyTwoFactorCode(secret, code) {
  // Implement 2FA verification logic here
  // This is a placeholder - you should use a proper 2FA library
  return code === secret.substring(0, 6);
}