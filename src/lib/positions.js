import { PrismaClient } from '@prisma/client';
import { POSITIONS } from '@/config/constants';

const prisma = new PrismaClient();

export async function getPositions() {
  return await prisma.position.findMany({
    orderBy: { displayOrder: 'asc' }
  });
}

export async function updatePositionLimits(positionId, limits) {
  return await prisma.position.update({
    where: { id: positionId },
    data: {
      totalSeats: limits.total,
      maleSeats: limits.male,
      femaleSeats: limits.female
    }
  });
}

export async function togglePositionStatus(positionId) {
  const position = await prisma.position.findUnique({
    where: { id: positionId }
  });

  return await prisma.position.update({
    where: { id: positionId },
    data: { isActive: !position.isActive }
  });
}

export async function validateVotingLimits(userId, positionId, candidateGender) {
  const position = await prisma.position.findUnique({
    where: { id: positionId }
  });

  const userVotes = await prisma.vote.count({
    where: {
      userId,
      candidate: {
        positionId
      }
    }
  });

  const genderVotes = await prisma.vote.count({
    where: {
      userId,
      candidate: {
        positionId,
        gender: candidateGender
      }
    }
  });

  const limits = POSITIONS[position.name];
  
  return {
    canVote: userVotes < limits.total && 
             genderVotes < (candidateGender === 'Male' ? limits.male : limits.female),
    remainingTotal: limits.total - userVotes,
    remainingGender: (candidateGender === 'Male' ? limits.male : limits.female) - genderVotes
  };
}