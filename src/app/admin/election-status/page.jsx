"use client";
import { useEffect, useState } from "react";
import styles from './electionStatus.module.css';
import Link from 'next/link';

export default function AdminElectionStatusPage() {
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
    fetchCandidates();
  }, []);

  async function fetchStats() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/election-status");
      if (!res.ok) throw new Error("Failed to fetch election status");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCandidates() {
    try {
      const res = await fetch("/api/admin/candidates");
      if (!res.ok) throw new Error("Failed to fetch candidates");
      const data = await res.json();
      setCandidates(data.candidates);
    } catch (e) {
      console.error("Error fetching candidates:", e);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/admin" className={styles.backButton}>
          ← Back to Dashboard
        </Link>
        <h2 className={styles.header}>Election Status</h2>
      </div>
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : stats ? (
        <>
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Status:</span>{" "}
              <span className={`${styles.statusBadge} ${stats.isActive ? styles.statusActive : styles.statusInactive}`}>
                {stats.isActive ? "Active" : "Not Active"}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Voting Period:</span>{" "}
              {stats.startTime ? new Date(stats.startTime).toLocaleString() : "-"} to {stats.endTime ? new Date(stats.endTime).toLocaleString() : "-"}
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Voters:</span> {stats.totalVoters}
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Votes Cast:</span> {stats.votedCount}
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Voter Turnout:</span> {stats.totalVoters > 0 ? ((stats.votedCount / stats.totalVoters) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <div className={styles.candidatesSection}>
            <h3 className={styles.sectionTitle}>Candidate Vote Counts</h3>
            <div className={styles.candidatesGrid}>
              {candidates.map((candidate) => (
                <div key={candidate.id} className={styles.candidateCard}>
                  <div className={styles.candidateInfo}>
                    <h4 className={styles.candidateName}>{candidate.name}</h4>
                    <p className={styles.candidatePosition}>{candidate.position.title}</p>
                    <p className={styles.candidateDepartment}>{candidate.department}</p>
                    <div className={styles.voteCount}>
                      <span className={styles.voteLabel}>Votes:</span>
                      <span className={styles.voteValue}>{candidate.voteCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
} 