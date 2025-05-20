import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { studentId, position } = await req.json();

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { studentId },
    });

    if (!student) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Student not found' 
      }), {
        status: 404,
      });
    }

    // Check if student is already a candidate
    const existingCandidate = await prisma.candidate.findUnique({
      where: { studentId },
    });

    if (existingCandidate) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Student is already a candidate' 
      }), {
        status: 400,
      });
    }

    // Get position requirements
    const positionData = await prisma.position.findUnique({
      where: { name: position },
      include: {
        candidates: true,
      },
    });

    if (!positionData) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Invalid position' 
      }), {
        status: 400,
      });
    }

    // Check gender quotas
    const currentCandidates = positionData.candidates;
    const maleCandidates = currentCandidates.filter(c => c.gender === 'MALE').length;
    const femaleCandidates = currentCandidates.filter(c => c.gender === 'FEMALE').length;

    if (student.gender === 'MALE' && maleCandidates >= positionData.maleLimitMax) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Male candidate limit reached for this position' 
      }), {
        status: 400,
      });
    }

    if (student.gender === 'FEMALE' && femaleCandidates >= positionData.femaleLimitMax) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Female candidate limit reached for this position' 
      }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ 
      valid: true,
      student: {
        name: student.name,
        department: student.department,
        gender: student.gender,
      },
    }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      valid: false, 
      error: error.message 
    }), {
      status: 500,
    });
  }
}