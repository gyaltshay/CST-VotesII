import { useState, useEffect } from 'react';
import ResultCard from './ResultCard';
import styles from './results.module.css';

export default function ResultsList() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [electionStatus, setElectionStatus] = useState({
    isActive: false,
    endDate: null
  });

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      // Fetch election status
      const statusRes = await fetch('/api/election/status');
      const statusData = await statusRes.json();
      setElectionStatus(statusData);

      if (!statusData.isActive || new Date() < new Date(statusData.endDate)) {
        setLoading(false);
        return;
      }

      // Fetch results
      const resultsRes = await fetch('/api/votes/count');
      const resultsData = await resultsRes.json();
      setResults(resultsData);
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={fetchResults} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  if (!electionStatus.isActive) {
    return (
      <div className={styles.message}>
        <h2>Election has not started yet</h2>
        <p>Results will be available once the election begins.</p>
      </div>
    );
  }

  if (new Date() < new Date(electionStatus.endDate)) {
    return (
      <div className={styles.message}>
        <h2>Voting is in progress</h2>
        <p>Results will be available after voting ends on:</p>
        <p className={styles.date}>
          {new Date(electionStatus.endDate).toLocaleString()}
        </p>
      </div>
    );
  }

  if (Object.keys(results).length === 0) {
    return (
      <div className={styles.message}>
        <h2>No votes recorded yet</h2>
        <p>Be the first to cast your vote!</p>
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      {Object.entries(results).map(([position, candidates]) => (
        <div key={position} className={styles.positionResults}>
          <h2 className={styles.positionTitle}>{position}</h2>
          <div className={styles.candidatesList}>
            {candidates.map(candidate => (
              <ResultCard
                key={candidate.id}
                candidate={candidate}
                totalVotes={candidates.reduce((sum, c) => sum + c.votes, 0)}
                isWinner={candidate.isWinner}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}