const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  try {
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@cst.edu.bt',
        password: hashedPassword,
        name: 'Admin',
        studentId: 'ADMIN001',
        department: 'Administration',
        yearOfStudy: 0,
        gender: 'Male',
        role: 'ADMIN',
        emailVerified: new Date()
      }
    });

    console.log('Admin user created successfully:', {
      email: admin.email,
      studentId: admin.studentId,
      role: admin.role
    });
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 