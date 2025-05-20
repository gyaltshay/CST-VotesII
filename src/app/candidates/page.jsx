import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import CandidatesClient from './CandidatesClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_POSITIONS = {
  chief_councillor: { title: 'Chief Councillor', maleSeats: 1, femaleSeats: 1 },
  deputy_chief_councillor: { title: 'Deputy Chief Councillor', maleSeats: 1, femaleSeats: 1 },
  games_health_councillor: { title: 'Games and Health Councillor', maleSeats: 1, femaleSeats: 1 },
  block_councillor: { title: 'Block Councillor', maleSeats: 1, femaleSeats: 1 },
  cultural_councillor: { title: 'Cultural Councillor', maleSeats: 1, femaleSeats: 1 },
  college_academic_councillor: { title: 'College Academic Councillor', maleSeats: 1, femaleSeats: 1 }
};

async function getCandidates() {
  const candidates = await prisma.candidate.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  return candidates.map(candidate => ({
    ...candidate,
    position: DEFAULT_POSITIONS[candidate.positionId] || { title: 'Unknown Position' }
  }));
}

async function getVotingStatus() {
  const status = await prisma.electionStatus.findFirst();
  return status || { isActive: false, startTime: null, endTime: null };
}

async function getUserVotes(session) {
  if (!session?.user) return [];
  
  const votes = await prisma.vote.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      candidate: true
    }
  });

  return votes.map(vote => ({
    positionId: vote.candidate.positionId,
    candidateId: vote.candidateId
  }));
}

export default async function CandidatesPage() {
  const session = await getServerSession(authOptions);
  const [candidates, votingStatus, userVotes] = await Promise.all([
    getCandidates(),
    getVotingStatus(),
    getUserVotes(session)
  ]);

  // Transform userVotes into the format expected by the client
  const selectedCandidates = userVotes.reduce((acc, vote) => {
    acc[vote.positionId] = vote.candidateId;
    return acc;
  }, {});

  return (
    <CandidatesClient 
      initialCandidates={candidates}
      initialVotingStatus={votingStatus}
      initialSelectedCandidates={selectedCandidates}
      session={session}
    />
  );
}