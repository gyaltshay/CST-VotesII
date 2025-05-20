import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { POSITIONS, DEPARTMENTS } from '../src/config/constants';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@cst.edu.bt' },
    update: {},
    create: {
      email: 'admin@cst.edu.bt',
      studentId: '00000000',
      name: 'System Admin',
      password: adminPassword,
      department: DEPARTMENTS.SOFTWARE_ENGINEERING,
      yearOfStudy: 4,
      gender: 'Male',
      role: 'ADMIN'
    }
  });

  // Create positions
  const positions = Object.entries(POSITIONS).map(([key, name], index) => ({
    name,
    displayOrder: index + 1,
    totalSeats: key === 'BLOCK_COUNCILLOR' ? 8 : 2,
    maleSeats: key === 'BLOCK_COUNCILLOR' ? 4 : 1,
    femaleSeats: key === 'BLOCK_COUNCILLOR' ? 4 : 1,
    isActive: true
  }));

  for (const position of positions) {
    await prisma.position.upsert({
      where: { name: position.name },
      update: position,
      create: position
    });
  }

  // Create initial election settings
  const now = new Date();
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + 7); // Set end time to 7 days from now

  await prisma.electionSettings.upsert({
    where: { id: '1' }, // Using a constant ID for the single settings record
    update: {
      votingStartTime: now,
      votingEndTime: endTime,
      isActive: true
    },
    create: {
      votingStartTime: now,
      votingEndTime: endTime,
      isActive: true
    }
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });