'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../admin/admin.module.css';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    fetchElections();
  }, [status, router]);

  async function fetchElections() {
    try {
      const res = await fetch('/api/elections/active');
      if (!res.ok) throw new Error('Failed to fetch elections');
      const data = await res.json();
      setElections(data.elections);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.alertError}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.adminHeader}>Welcome, {session?.user?.name || 'Student'}</h1>

      {elections.length === 0 ? (
        <div className={styles.card}>
          <p className="text-gray-600">No active elections at the moment.</p>
        </div>
      ) : (
        <div className={`${styles.gridContainer} ${styles.gridCol2}`}>
          {elections.map(election => (
            <div key={election.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{election.title}</h2>
              </div>
              <div className={styles.cardContent}>
                <p className="text-gray-600 mb-4">{election.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(election.startDate).toLocaleDateString()} - {new Date(election.endDate).toLocaleDateString()}
                  </span>
                  <a
                    href={`/vote/${election.id}`}
                    className={styles.primaryButton}
                  >
                    Vote Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Quick Links</h2>
        </div>
        <div className={styles.cardContent}>
          <div className={`${styles.gridContainer} ${styles.gridCol2}`}>
            <a href="/results" className={`${styles.card} hover:shadow-lg transition-shadow`}>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">View Results</h3>
              <p className="text-gray-600">Check current election results and statistics</p>
            </a>
            <a href="/help" className={`${styles.card} hover:shadow-lg transition-shadow`}>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">Help & Support</h3>
              <p className="text-gray-600">Get assistance with voting or report issues</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 