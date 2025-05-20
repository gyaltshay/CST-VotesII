'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navigation/Navbar';
import Footer from '@/components/Navigation/Footer';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }) {
  const pathname = usePathname();

  // Don't apply main layout to admin pages
  if (pathname.startsWith('/admin')) {
    return children;
  }

  return (
    <div className={styles.layout}>
      <Navbar />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}