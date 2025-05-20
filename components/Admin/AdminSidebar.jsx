'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();

  const sidebarLinks = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: '📊'
    },
    {
      href: '/admin/candidates',
      label: 'Candidates',
      icon: '👥'
    },
    {
      href: '/admin/positions',
      label: 'Positions',
      icon: '🎯'
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: '👤'
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: '⚙️'
    }
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNav}>
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.sidebarLink} ${
              pathname === link.href ? styles.active : ''
            }`}
          >
            <span className={styles.icon}>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
} 