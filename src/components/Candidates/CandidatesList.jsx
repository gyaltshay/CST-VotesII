'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import styles from './candidates.module.css';

export default function CandidatesList({ positions, isVotingOpen }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState({});

  const handleVote = async (candidateId, positionId) => {
    if (!session) {
      toast.error('Please log in to vote');
      return;
    }

    if (!isVotingOpen) {
      toast.error('Voting is currently closed');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cast vote');
      }

      // Update selected candidates
      setSelectedCandidates(prev => ({
        ...prev,
        [positionId]: [...(prev[positionId] || []), candidateId]
      }));

      toast.success('Vote cast successfully!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasVotedForCandidate = (candidateId, positionId) => {
    return selectedCandidates[positionId]?.includes(candidateId);
  };

  const renderCandidateCard = (candidate, position) => {
    const hasVoted = hasVotedForCandidate(candidate.id, position.id);
    
    return (
      <div key={candidate.id} className={styles.candidateCard}>
        {candidate.imageUrl && (
          <div className={styles.imageContainer}>
            <img 
              src={candidate.imageUrl} 
              alt={`${candidate.name}'s photo`}
              className={styles.candidateImage}
            />
          </div>
        )}
        <div className={styles.candidateInfo}>
          <h3>{candidate.name}</h3>
          <p className={styles.studentId}>Student ID: {candidate.studentId}</p>
          <p className={styles.department}>{candidate.department}</p>
          <div className={styles.manifestoContainer}>
            <h4>Manifesto:</h4>
            <p>{candidate.manifesto}</p>
          </div>
          {isVotingOpen && (
            <button
              onClick={() => handleVote(candidate.id, position.id)}
              disabled={loading || hasVoted}
              className={`${styles.voteButton} ${hasVoted ? styles.voted : ''}`}
            >
              {hasVoted ? 'Voted' : 'Vote'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.candidatesContainer}>
      {positions.map(position => (
        <div key={position.id} className={styles.positionSection}>
          <h2 className={styles.positionTitle}>{position.name}</h2>
          <div className={styles.positionInfo}>
            <p>Total Seats: {position.totalSeats}</p>
            <p>Male Seats: {position.maleSeats}</p>
            <p>Female Seats: {position.femaleSeats}</p>
          </div>
          <div className={styles.candidatesGrid}>
            {position.candidates
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(candidate => renderCandidateCard(candidate, position))
            }
          </div>
        </div>
      ))}
    </div>
  );
} 