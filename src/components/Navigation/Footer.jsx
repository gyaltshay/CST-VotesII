import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.title}>CST Votes</h3>
            <p className={styles.description}>
              A secure and transparent platform for student council elections at the
              College of Science and Technology, Bhutan.
            </p>
          </div>

          <div className={styles.section}>
            <h3 className={styles.title}>Quick Links</h3>
            <ul className={styles.links}>
              <li>
                <Link href="/candidates">Candidates</Link>
              </li>
              <li>
                <Link href="/results">Results</Link>
              </li>
              <li>
                <Link href="/help">Help</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.title}>Contact</h3>
            <ul className={styles.contactInfo}>
              <li>
                <strong>Email:</strong> support@cstvotes.edu.bt
              </li>
              <li>
                <strong>Phone:</strong> +975-17-123456
              </li>
              <li>
                <strong>Location:</strong> IT Help Desk, Administration Building
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} College of Science and Technology, Bhutan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}