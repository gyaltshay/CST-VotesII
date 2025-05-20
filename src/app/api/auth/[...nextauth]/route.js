import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { generateTwoFactorCode } from '@/lib/2fa';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: "Student ID or Email", type: "text" },
        password: { label: "Password", type: "password" },
        isAdmin: { label: "Is Admin", type: "boolean" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Please enter your credentials');
        }

        const isAdminLogin = credentials.isAdmin === 'true';
        const user = await prisma.user.findFirst({
          where: isAdminLogin
            ? { email: credentials.identifier, role: 'ADMIN' }
            : { studentId: credentials.identifier }
        });

        if (!user) {
          throw new Error(isAdminLogin 
            ? 'Invalid admin credentials' 
            : 'No user found with this student ID'
          );
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        // Generate and send 2FA code if not admin
        if (!isAdminLogin) {
          const code = await generateTwoFactorCode(user.id);
          await sendVerificationEmail(user.email, code);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
          gender: user.gender,
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-2fa',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        // Validate email domain
        if (!profile.email.endsWith('@rub.edu.bt')) {
          return false;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email }
        });

        if (!existingUser) {
          // Create new user from Google profile
          const studentId = profile.email.split('@')[0];
          await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name,
              studentId,
              password: '', // Will be set on first login
              department: '', // To be updated by user
              yearOfStudy: 1, // Default value
              gender: 'Male', // Default value
              role: 'STUDENT',
              emailVerified: new Date(),
            }
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.studentId = user.studentId;
        token.department = user.department;
        token.gender = user.gender;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.studentId = token.studentId;
        session.user.department = token.department;
        session.user.gender = token.gender;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };