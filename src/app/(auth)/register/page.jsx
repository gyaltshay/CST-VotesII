'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    yearOfStudy: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill email based on student ID
    if (name === 'studentId') {
      setFormData(prev => ({
        ...prev,
        email: `${value}.cst@rub.edu.bt`
      }));
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/\d{8}/.test(formData.studentId)) {
      setError('Invalid student ID format');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1>Create Account</h1>
        <p className={styles.subtitle}>Join CST Votes to participate in elections</p>

        {error && (
          <div className={styles.error}>
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
            <label htmlFor="email">College Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              readOnly
              className={`${styles.input} ${styles.readonly}`}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Select Department</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Electronics and Communication">Electronics and Communication</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="yearOfStudy">Year of Study</label>
              <select
                id="yearOfStudy"
                name="yearOfStudy"
                value={formData.yearOfStudy}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Select Year</option>
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Fourth Year</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Gender</label>
            <div className={styles.radioGroup}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={formData.gender === 'Male'}
                  onChange={handleChange}
                  required
                />
                Male
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={formData.gender === 'Female'}
                  onChange={handleChange}
                  required
                />
                Female
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.login}>
          Already have an account?{' '}
          <Link href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}