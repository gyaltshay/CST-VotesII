import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './db';
import { EMAIL_REGEX, AUTH_ERRORS } from './constants';
import { hashPassword, verifyPassword } from '@/lib/auth';
import '../config/validateEnv'; // Ensure ENV validation runs at startup

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required in your environment.');
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth client ID and secret are required in your environment.');
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email;
        if (!EMAIL_REGEX.test(email)) {
          throw new Error(AUTH_ERRORS.INVALID_EMAIL);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.department = token.department;
      }
      return session;
    },
  },
  providers: [
    {
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password');
        }

        if (!EMAIL_REGEX.test(credentials.email)) {
          throw new Error(AUTH_ERRORS.INVALID_EMAIL);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
        }

        const isValid = await verifyPassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error(AUTH_ERRORS.INCORRECT_PASSWORD);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        };
      },
    },
  ],
};