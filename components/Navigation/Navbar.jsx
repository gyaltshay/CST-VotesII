import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
  const session = { user: { role: 'ADMIN' } }; // Assuming a default session
  const pathname = '/admin/dashboard'; // Assuming a default pathname

  return (
    <div>
      {session.user.role === 'ADMIN' && (
        <Link 
          href="/admin/dashboard" 
          className={`${styles.adminButton} ${pathname.startsWith('/admin') ? styles.active : ''}`}
        >
          Admin Panel
        </Link>
      )}
    </div>
  );
};

export default Navbar; 