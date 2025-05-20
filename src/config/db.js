import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;

export async function connectToDB() {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw new Error('Database connection failed');
  }
}

export async function disconnectDB() {
  await prisma.$disconnect();
}

export async function checkDBConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}