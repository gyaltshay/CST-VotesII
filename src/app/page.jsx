'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      router.push('/login');
    }
  }, [router]);

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>CST Votes</h1>
          <p className={styles.subtitle}>
            College of Science and Technology Student Council Elections
          </p>
          {!session ? (
            <div className={styles.ctaButtons}>
              <Link href="/login" className={styles.primaryButton}>
                Login to Vote
              </Link>
              <Link href="/register" className={styles.secondaryButton}>
                Register Now
              </Link>
            </div>
          ) : (
            <div className={styles.ctaButtons}>
              <Link href="/candidates" className={styles.primaryButton}>
                View Candidates
              </Link>
              <Link href="/results" className={styles.secondaryButton}>
                View Results
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.container}>
          <h2>Features</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>Secure Voting</h3>
              <p>Authenticated voting system with student ID verification</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3>Real-time Results</h3>
              <p>Watch live vote counting and winner announcements</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3>Fair Representation</h3>
              <p>Gender-balanced voting system for equal representation</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <h2>How It Works</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Register</h3>
              <p>Create an account using your college email</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Browse Candidates</h3>
              <p>View candidate profiles and manifestos</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Cast Your Vote</h3>
              <p>Vote for your preferred candidates</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.electionInfo}>
        <div className={styles.container}>
          <h2>Current Election</h2>
          <div className={styles.infoCard}>
            <h3>Student Council Elections 2025-2026</h3>
            <p>Choose your representatives for the upcoming academic year</p>
            <ul className={styles.positionsList}>
              <li>VOTE FOR THE BEST</li>
            </ul>
            {session ? (
              <Link href="/candidates" className={styles.primaryButton}>
                View Candidates
              </Link>
            ) : (
              <Link href="/login" className={styles.primaryButton}>
                Login to Participate
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
} 