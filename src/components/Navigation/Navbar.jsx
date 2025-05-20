'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import styles from './Navigation.module.css';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Don't show the main navigation on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      await signOut({ callbackUrl: '/login' });
    }
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          CST Votes
        </Link>

        <button 
          className={styles.menuButton} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span className={styles.menuIcon}></span>
        </button>

        <div className={`${styles.menu} ${isMenuOpen ? styles.active : ''}`}>
          <div className={styles.navLinks}>
            <Link 
              href="/" 
              className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
            >
              Home
            </Link>

            {status === 'authenticated' && (
              <>
                <Link 
                  href="/candidates" 
                  className={`${styles.navLink} ${isActive('/candidates') ? styles.active : ''}`}
                >
                  Candidates
                </Link>
                
                <Link 
                  href="/results" 
                  className={`${styles.navLink} ${isActive('/results') ? styles.active : ''}`}
                >
                  Results
                </Link>
              </>
            )}

            <Link 
              href="/help" 
              className={`${styles.navLink} ${isActive('/help') ? styles.active : ''}`}
            >
              Help
            </Link>
          </div>

          <div className={styles.authButtons}>
            {status === 'authenticated' ? (
              <>
                {session.user.role === 'ADMIN' && (
                  <Link 
                    href="/admin/dashboard" 
                    className={`${styles.adminButton} ${pathname.startsWith('/admin') ? styles.active : ''}`}
                  >
                    Admin Panel
                  </Link>
                )}
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{session.user.name}</span>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link href="/login" className={styles.loginButton}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}