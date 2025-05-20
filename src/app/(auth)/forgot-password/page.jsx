'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './forgot-password.module.css';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate email format
      const emailPattern = /^\d{8}\.cst@rub\.edu\.bt$/;
      if (!emailPattern.test(email)) {
        throw new Error('Please enter a valid college email (format: 12345678.cst@rub.edu.bt)');
      }

      // Send password reset request
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess('Password reset email sent! Please check your inbox.');
      setEmail(''); // Clear the form
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1>Forgot Password</h1>
        <p className={styles.subtitle}>Enter your college email to receive a password reset link</p>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">College Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="12345678.cst@rub.edu.bt"
              pattern="^\d{8}\.cst@rub\.edu\.bt$"
              required
              className={styles.input}
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className={styles.login}>
          Remember your password?{' '}
          <Link href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}