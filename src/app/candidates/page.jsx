"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from './candidates.module.css';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function CandidatesPage() {
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [votingStatus, setVotingStatus] = useState(null);

  useEffect(() => {
    fetchCandidates();
    fetchVotingStatus();
    if (session?.user) {
      fetchUserVotes();
    }
  }, [session]);

  async function fetchVotingStatus() {
    try {
      const res = await fetch('/api/election/status');
      if (!res.ok) throw new Error('Failed to fetch voting status');
      const data = await res.json();
      setVotingStatus(data);
    } catch (err) {
      console.error('Error fetching voting status:', err);
      setError('Failed to fetch voting status');
    }
  }

  async function fetchCandidates() {
    try {
      const res = await fetch('/api/candidates');
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const data = await res.json();
      setCandidates(data.candidates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserVotes() {
    try {
      const res = await fetch('/api/votes/user');
      if (!res.ok) throw new Error('Failed to fetch votes');
      const data = await res.json();
      console.log('Fetched votes data:', data);
      
      // Create a map of positionId to candidateId for voted candidates
      const votedCandidates = {};
      data.votes.forEach(vote => {
        console.log('Processing vote:', vote);
        votedCandidates[vote.candidate.positionId] = vote.candidate.id;
      });
      
      console.log('Setting selectedCandidates to:', votedCandidates);
      setSelectedCandidates(votedCandidates);
    } catch (err) {
      console.error('Failed to fetch user votes:', err);
    }
  }

  const handleVote = async (candidateId, positionId) => {
    if (!session) {
      setError("Please login to vote");
      return;
    }

    if (!votingStatus?.isActive) {
      setError("Voting is not currently active");
      return;
    }

    const now = new Date();
    const startTime = new Date(votingStatus.startTime);
    const endTime = new Date(votingStatus.endTime);

    if (now < startTime) {
      setError(`Voting will start at ${startTime.toLocaleString()}`);
      return;
    }

    if (now > endTime) {
      setError("Voting has ended");
      return;
    }

    if (!window.confirm("Are you sure you want to vote for this candidate? This action cannot be undone.")) {
      return;
    }

    try {
      console.log('Submitting vote for candidate:', candidateId, 'position:', positionId);
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit vote');
      }

      const responseData = await res.json();
      console.log('Vote response:', responseData);

      // Update the selectedCandidates state immediately
      setSelectedCandidates(prev => {
        const newState = {
          ...prev,
          [positionId]: candidateId
        };
        console.log('Updating selectedCandidates to:', newState);
        return newState;
      });
      
      setSuccess('Vote submitted successfully');
      
      // Refresh the user's votes to ensure consistency
      await fetchUserVotes();
    } catch (err) {
      console.error('Vote error:', err);
      setError(err.message);
    }
  };

  const openModal = (candidate) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCandidate(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingText}>Loading candidates...</div>
      </div>
    );
  }

  // Group candidates by position
  const candidatesByPosition = candidates.reduce((acc, candidate) => {
    const position = candidate.position;
    if (!acc[position.id]) {
      acc[position.id] = {
        position,
        candidates: []
      };
    }
    acc[position.id].candidates.push(candidate);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Election Candidates</h1>

      {error && <div className={styles.alertError}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      {votingStatus && (
        <div className={styles.votingStatus}>
          <p>Voting Status: {votingStatus.isActive ? 'Active' : 'Inactive'}</p>
          <p>Start Time: {new Date(votingStatus.startTime).toLocaleString()}</p>
          <p>End Time: {new Date(votingStatus.endTime).toLocaleString()}</p>
        </div>
      )}

      {Object.values(candidatesByPosition).map(({ position, candidates }) => (
        <div key={position.id} className={styles.positionSection}>
          <h2 className={styles.positionTitle}>{position.title}</h2>
          <p className={styles.positionDescription}>{position.description}</p>
          
          <div className={styles.candidatesGrid}>
            {candidates.map(candidate => {
              const hasVoted = selectedCandidates[position.id] === candidate.id;
              return (
                <div key={candidate.id} className={styles.candidateCard}>
                  {candidate.imageUrl && (
                    <img 
                      src={candidate.imageUrl} 
                      alt={candidate.name}
                      className={styles.candidateImage}
                      onClick={() => openModal(candidate)}
                    />
                  )}
                  <div className={styles.candidateInfo}>
                    <h3 className={styles.candidateName}>{candidate.name}</h3>
                    <p className={styles.candidateDepartment}>{candidate.department}</p>
                    <p className={styles.candidateManifesto}>{candidate.manifesto}</p>
                  </div>
                  <button
                    onClick={() => handleVote(candidate.id, position.id)}
                    className={`${styles.voteButton} ${hasVoted ? styles.votedButton : ''}`}
                    disabled={hasVoted || selectedCandidates[position.id]}
                  >
                    {hasVoted ? 'Voted' : 'Vote'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showModal && selectedCandidate && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeModal}>×</button>
            <div className={styles.modalImageContainer}>
              {selectedCandidate.imageUrl && (
                <img 
                  src={selectedCandidate.imageUrl} 
                  alt={selectedCandidate.name}
                  className={styles.modalImage}
                />
              )}
            </div>
            <div className={styles.modalInfo}>
              <h2 className={styles.modalName}>{selectedCandidate.name}</h2>
              <p className={styles.modalDepartment}>{selectedCandidate.department}</p>
              <div className={styles.modalManifesto}>
                <h3>Manifesto:</h3>
                <p>{selectedCandidate.manifesto}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}