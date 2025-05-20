import Link from 'next/link';
import styles from './Help.module.css';

export function HelpGuide() {
  return (
    <div className={styles.guide}>
      <h2 className={styles.sectionTitle}>How to Use CST Votes</h2>
      
      <div className={styles.guideGrid}>
        <div className={styles.guideCard}>
          <div className={styles.guideIcon}>🔑</div>
          <h3>Logging In</h3>
          <ol className={styles.guideList}>
            <li>Visit the <Link href="/login">Student Login</Link> page</li>
            <li>Enter your student ID and password</li>
            <li>Use your official CST student credentials</li>
            <li>Enable two-factor authentication for extra security</li>
          </ol>
        </div>

        <div className={styles.guideCard}>
          <div className={styles.guideIcon}>🗳️</div>
          <h3>Casting Your Vote</h3>
          <ol className={styles.guideList}>
            <li>Browse through available candidates</li>
            <li>Review their manifestos carefully</li>
            <li>Select candidates based on position and gender quotas</li>
            <li>Confirm your selections</li>
            <li>Wait for the confirmation message</li>
          </ol>
        </div>

        <div className={styles.guideCard}>
          <div className={styles.guideIcon}>📊</div>
          <h3>Viewing Results</h3>
          <ol className={styles.guideList}>
            <li>Navigate to the <Link href="/results">Results</Link> page</li>
            <li>Results are visible after voting ends</li>
            <li>View department-wise breakdowns</li>
            <li>Check real-time updates</li>
          </ol>
        </div>

        <div className={styles.guideCard}>
          <div className={styles.guideIcon}>🔒</div>
          <h3>Privacy & Security</h3>
          <ol className={styles.guideList}>
            <li>All votes are anonymous</li>
            <li>Use campus WiFi for secure voting</li>
            <li>Never share login credentials</li>
            <li>Enable two-factor authentication</li>
            <li>Log out after voting</li>
          </ol>
        </div>
      </div>
    </div>
  );
}