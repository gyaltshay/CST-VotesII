import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        studentId: formData.studentId,
        password: formData.password
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Login to CST Votes</h2>
      
      {error && (
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="studentId">Student ID</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            pattern="\d{8}"
            placeholder="Enter your 8-digit student ID"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className={styles.divider}>or</div>

        <button
          type="button"
          onClick={() => signIn('google')}
          className={styles.googleButton}
        >
          Continue with Google
        </button>

        <div className={styles.links}>
          <a href="/forgot-password" className={styles.link}>
            Forgot Password?
          </a>
          <a href="/register" className={styles.link}>
            Create Account
          </a>
        </div>
      </form>
    </div>
  );
}