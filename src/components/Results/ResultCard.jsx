import Image from 'next/image';
import styles from './results.module.css';

export default function ResultCard({ candidate, totalVotes, isWinner }) {
  const votePercentage = totalVotes > 0 
    ? ((candidate.votes / totalVotes) * 100).toFixed(1) 
    : 0;

  return (
    <div className={`${styles.resultCard} ${isWinner ? styles.winner : ''}`}>
      {isWinner && <div className={styles.winnerBadge}>Winner 🏆</div>}
      
      <div className={styles.candidateInfo}>
        <div className={styles.imageContainer}>
          <Image
            src={candidate.imageUrl || '/placeholder.jpg'}
            alt={candidate.name}
            width={80}
            height={80}
            className={styles.candidateImage}
          />
          <span className={`${styles.genderBadge} ${styles[candidate.gender.toLowerCase()]}`}>
            {candidate.gender === 'Male' ? '♂' : '♀'}
          </span>
        </div>

        <div className={styles.details}>
          <h3 className={styles.name}>{candidate.name}</h3>
          <p className={styles.department}>{candidate.department}</p>
        </div>

        <div className={styles.voteCount}>
          <span className={styles.votes}>{candidate.votes}</span>
          <span className={styles.percentage}>{votePercentage}%</span>
        </div>
      </div>

      <div className={styles.progressContainer}>
        <div 
          className={styles.progressBar} 
          style={{ width: `${votePercentage}%` }}
        ></div>
      </div>
    </div>
  );
}