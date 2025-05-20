const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyEmail() {
  try {
    const user = await prisma.user.update({
      where: { studentId: '02230140' },
      data: { emailVerified: new Date() }
    });
    console.log('Successfully verified email for:', user.studentId);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEmail(); 