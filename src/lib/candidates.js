import prisma from '@/config/db';
import { uploadImage } from './cloudinary';
import { logAudit } from './audit';

export async function createCandidate(data, image) {
  let imageUrl = null;
  if (image) {
    imageUrl = await uploadImage(image);
  }

  const candidate = await prisma.candidate.create({
    data: {
      ...data,
      imageUrl
    }
  });

  await logAudit(data.userId, 'CANDIDATE_ADD', {
    candidateId: candidate.id,
    position: candidate.position
  });

  return candidate;
}

export async function updateCandidate(id, data, image) {
  let imageUrl = data.imageUrl;
  if (image) {
    imageUrl = await uploadImage(image);
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: {
      ...data,
      imageUrl
    }
  });

  await logAudit(data.userId, 'CANDIDATE_UPDATE', {
    candidateId: candidate.id,
    position: candidate.position
  });

  return candidate;
}

export async function deleteCandidate(id, userId) {
  const candidate = await prisma.candidate.delete({
    where: { id }
  });

  await logAudit(userId, 'CANDIDATE_DELETE', {
    candidateId: id,
    position: candidate.position
  });

  return candidate;
}

export async function getCandidatesByPosition(position) {
  return prisma.candidate.findMany({
    where: { position },
    include: {
      _count: {
        select: { votes: true }
      }
    }
  });
}

export async function getCandidatesByDepartment(department) {
  return prisma.candidate.findMany({
    where: { department },
    include: {
      _count: {
        select: { votes: true }
      }
    }
  });
}

export async function validateCandidateQuotas(position, gender) {
  const existingCandidates = await prisma.candidate.findMany({
    where: { position }
  });

  const genderCount = existingCandidates.filter(c => c.gender === gender).length;
  const totalCount = existingCandidates.length;

  // Add your quota validation logic here
  // Return true if quotas are met, false otherwise
  return true;
}