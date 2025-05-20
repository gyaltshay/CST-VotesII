import Image from 'next/image';
import { useState } from 'react';
import styles from './candidates.module.css';

export default function CandidateCard({ 
  candidate, 
  onVote, 
  hasVoted, 
  isVotingOpen 
}) {
  const [showModal, setShowModal] = useState(false);

  const handleVoteClick = async () => {
    if (window.confirm(`Confirm your vote for ${candidate.name}?`)) {
      await onVote(candidate.id);
    }
  };

  return (
    <>
      <div className={styles.candidateCard}>
        <div className={styles.imageContainer}>
          <Image
            src={candidate.imageUrl || '/placeholder.jpg'}
            alt={candidate.name}
            width={200}
            height={200}
            className={styles.candidateImage}
          />
          <span className={`${styles.genderBadge} ${styles[candidate.gender.toLowerCase()]}`}>
            {candidate.gender === 'Male' ? '♂' : '♀'}
          </span>
        </div>

        <div className={styles.cardContent}>
          <h3 className={styles.candidateName}>{candidate.name}</h3>
          <p className={styles.candidateInfo}>
            {candidate.department} • {candidate.position.name}
          </p>
          
          <p className={styles.manifesto}>
            {candidate.manifesto.length > 100 
              ? `${candidate.manifesto.substring(0, 100)}...` 
              : candidate.manifesto}
          </p>

          <div className={styles.cardActions}>
            <button
              onClick={() => setShowModal(true)}
              className={styles.detailsButton}
            >
              View Details
            </button>

            {isVotingOpen && (
              <button
                onClick={handleVoteClick}
                disabled={hasVoted}
                className={`${styles.voteButton} ${hasVoted ? styles.voted : ''}`}
              >
                {hasVoted ? 'Voted' : 'Vote'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button 
              className={styles.closeButton}
              onClick={() => setShowModal(false)}
            >
              ×
            </button>

            <Image
              src={candidate.imageUrl || '/placeholder.jpg'}
              alt={candidate.name}
              width={300}
              height={300}
              className={styles.modalImage}
            />

            <h2 className={styles.modalTitle}>{candidate.name}</h2>
            <p className={styles.modalInfo}>
              {candidate.department} • {candidate.position.name}
            </p>

            <div className={styles.manifestoSection}>
              <h3>Manifesto</h3>
              <p>{candidate.manifesto}</p>
            </div>

            {isVotingOpen && (
              <button
                onClick={() => {
                  handleVoteClick();
                  setShowModal(false);
                }}
                disabled={hasVoted}
                className={`${styles.voteButton} ${hasVoted ? styles.voted : ''}`}
              >
                {hasVoted ? 'Voted' : 'Vote Now'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}