import prisma from '@/config/db';
import styles from './results.module.css';
import Link from 'next/link';

async function getResults() {
  try {
    // Get all candidates with their votes
    const candidates = await prisma.candidate.findMany({
      include: {
        votes: {
          include: {
            user: {
              select: {
                department: true
              }
            }
          }
        }
      }
    });

    // Get total number of voters (students)
    const totalVoters = await prisma.user.count({
      where: {
        role: 'STUDENT'
      }
    });

    // Get election settings
    const election = await prisma.electionSettings.findFirst({
      where: {
        isActive: true
      }
    });

    // Process all candidates' results
    const processedCandidates = candidates.map(candidate => {
      // Calculate department-wise votes
      const departmentStats = candidate.votes.reduce((acc, vote) => {
        const dept = vote.user?.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      return {
        id: candidate.id,
        name: candidate.name,
        department: candidate.department,
        imageUrl: candidate.imageUrl,
        voteCount: candidate.votes.length,
        departmentStats
      };
    });

    // Calculate total votes across all candidates
    const totalVotes = processedCandidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

    return {
      candidates: processedCandidates,
      totalVotes,
      totalVoters,
      election: election ? {
        isActive: election.isActive,
        startTime: election.votingStartTime,
        endTime: election.votingEndTime
      } : null
    };
  } catch (error) {
    console.error('Error fetching results:', error);
    throw new Error('Failed to fetch results');
  }
}

export default async function ResultsPage() {
  const results = await getResults();

  // If no results, show error
  if (!results || !results.candidates || results.candidates.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.errorText}>No results available</div>
      </div>
    );
  }

  // Check if voting is still active
  const now = new Date();
  const votingEnd = results.election?.endTime ? new Date(results.election.endTime) : null;
  if (results.election?.isActive && votingEnd && now < votingEnd) {
    return (
      <div className={styles.container}>
        <div className={styles.errorText}>
          Results will be available after voting ends.<br />
          Voting ends at: {votingEnd.toLocaleString()}
        </div>
      </div>
    );
  }

  // Otherwise, show results
  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/" className={styles.backButton}>
          ← Back to Home
        </Link>
        <h1 className={styles.title}>Election Results</h1>
      </div>
      
      {results.election && (
        <div className={styles.electionInfo}>
          <h2 className={styles.electionTitle}>Election Information</h2>
          <div className={styles.electionDetails}>
            <div className={styles.electionDetail}>
              <span className={styles.detailLabel}>Status:</span>
              <span className={`${styles.detailValue} ${results.election.isActive ? styles.statusActive : styles.statusInactive}`}>
                {results.election.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className={styles.electionDetail}>
              <span className={styles.detailLabel}>Start Time:</span>
              <span className={styles.detailValue}>
                {new Date(results.election.startTime).toLocaleString()}
              </span>
            </div>
            <div className={styles.electionDetail}>
              <span className={styles.detailLabel}>End Time:</span>
              <span className={styles.detailValue}>
                {new Date(results.election.endTime).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.resultsGrid}>
        {results.candidates.map((candidate) => (
          <div key={candidate.id} className={styles.candidateCard}>
            {candidate.imageUrl && (
              <img 
                src={candidate.imageUrl} 
                alt={candidate.name}
                className={styles.candidateImage}
              />
            )}
            <div className={styles.candidateInfo}>
              <h3 className={styles.candidateName}>{candidate.name}</h3>
              <p className={styles.candidateDepartment}>{candidate.department}</p>
              <div className={styles.voteStats}>
                <div className={styles.voteCount}>
                  <span className={styles.label}>Votes:</span>
                  <span className={styles.value}>{candidate.voteCount}</span>
                </div>
                <div className={styles.votePercentage}>
                  <span className={styles.label}>Percentage:</span>
                  <span className={styles.value}>
                    {results.totalVotes > 0 
                      ? ((candidate.voteCount / results.totalVotes) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
              {candidate.departmentStats && Object.keys(candidate.departmentStats).length > 0 && (
                <div className={styles.departmentStats}>
                  <h4>Department-wise Votes:</h4>
                  {Object.entries(candidate.departmentStats).map(([dept, count]) => (
                    <div key={dept} className={styles.deptStat}>
                      <span className={styles.deptName}>{dept}:</span>
                      <span className={styles.deptCount}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.stats}>
        <p>Total Votes: {results.totalVotes}</p>
        <p>Total Voters: {results.totalVoters}</p>
        <p>Voter Turnout: {results.totalVoters > 0 
          ? ((results.totalVotes / results.totalVoters) * 100).toFixed(1)
          : 0}%</p>
      </div>
    </div>
  );
}