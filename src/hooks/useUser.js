import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function useUser() {
  const { data: session, status } = useSession();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserDetails() {
      if (!session?.user?.studentId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${session.user.studentId}`);
        if (!response.ok) throw new Error('Failed to fetch user details');
        
        const data = await response.json();
        setUserDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserDetails();
  }, [session]);

  return {
    user: userDetails,
    loading: status === 'loading' || loading,
    error,
    isAuthenticated: !!session
  };
}

export function useVotingStatus(userId) {
  const [votingStatus, setVotingStatus] = useState({
    votedPositions: [],
    remainingVotes: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchVotingStatus() {
      if (!userId) return;

      try {
        const response = await fetch(`/api/users/${userId}/voting-status`);
        if (!response.ok) throw new Error('Failed to fetch voting status');
        
        const data = await response.json();
        setVotingStatus(prev => ({
          ...prev,
          ...data,
          loading: false
        }));
      } catch (err) {
        setVotingStatus(prev => ({
          ...prev,
          error: err.message,
          loading: false
        }));
      }
    }

    fetchVotingStatus();
  }, [userId]);

  return votingStatus;
}