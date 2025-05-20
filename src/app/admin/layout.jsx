"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import styles from "./admin.module.css";

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      await signOut({ callbackUrl: '/login' });
    }
  };

  if (status === "loading") {
    return <div className={styles.loadingScreen}>Loading...</div>;
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className={styles.adminLayout}>
      <div className={styles.adminHeader}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
      <main className={styles.adminMain}>{children}</main>
    </div>
  );
} 