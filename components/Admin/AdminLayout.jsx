'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!session?.user?.isAdmin) {
    router.push('/login');
    return null;
  }

  return (
    <div className={styles.adminLayout}>
      <AdminNavbar />
      <div className={styles.container}>
        <AdminSidebar />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
} 