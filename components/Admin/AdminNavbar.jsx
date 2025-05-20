'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './admin.module.css';

export default function AdminNavbar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      await signOut({ callbackUrl: '/admin/login' });
    }
  };

  return (
    <nav className={styles.adminNavbar}>
      <div className={styles.navContainer}>
        <div className={styles.leftSection}>
          <Link href="/admin/dashboard" className={styles.logo}>
            <span className={styles.logoIcon}>👑</span>
            CST Votes Admin
          </Link>
        </div>

        <div className={styles.rightSection}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <span className={styles.logoutIcon}>🚪</span>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
} 