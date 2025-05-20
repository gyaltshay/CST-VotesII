'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from './verify-2fa.module.css';

export default function Verify2FA() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Sign in with the verified credentials
      const result = await signIn('credentials', {
        redirect: false,
        code,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      alert('A new verification code has been sent to your email');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Two-Factor Authentication</h1>
        <p className={styles.description}>
          Please enter the verification code sent to your email
        </p>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className={styles.input}
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <button
          onClick={handleResendCode}
          className={styles.resendButton}
          disabled={loading}
        >
          Resend Code
        </button>
      </div>
    </div>
  );
} 