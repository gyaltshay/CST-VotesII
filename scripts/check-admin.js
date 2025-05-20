const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@cst.edu.bt',
        role: 'ADMIN'
      }
    });

    if (admin) {
      console.log('Admin user found:', {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        studentId: admin.studentId
      });
    } else {
      console.log('Admin user not found. Creating new admin user...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin@123', 12);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@cst.edu.bt',
          password: hashedPassword,
          name: 'System Admin',
          studentId: 'ADMIN001',
          department: 'Administration',
          yearOfStudy: 0,
          gender: 'Male',
          role: 'ADMIN',
          emailVerified: new Date()
        }
      });

      console.log('New admin user created:', {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
        studentId: newAdmin.studentId
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin(); 