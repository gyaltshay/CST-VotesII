import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [session, status, router]);

  return {
    isAdmin: session?.user?.role === 'ADMIN',
    loading: status === 'loading',
    session
  };
}

export function useAdminGuard() {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <div>Unauthorized. Please log in as an administrator.</div>;
  }

  return null;
}