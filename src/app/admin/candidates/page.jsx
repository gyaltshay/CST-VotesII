"use client";
import { useEffect, useState } from "react";
import styles from './candidates.module.css';
import Link from 'next/link';

const DEFAULT_POSITIONS = [
  { id: 'chief_councillor', title: 'Chief Councillor' },
  { id: 'deputy_chief_councillor', title: 'Deputy Chief Councillor' },
  { id: 'games_health_councillor', title: 'Games and Health Councillor' },
  { id: 'block_councillor', title: 'Block Councillor' },
  { id: 'cultural_councillor', title: 'Cultural Councillor' },
  { id: 'college_academic_councillor', title: 'College Academic Councillor' }
];

const DEPARTMENTS = [
  'Software Engineering',
  'Information Technology Engineering',
  'Electronics and Communication',
  'Civil Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Architecture Engineering',
  'Instrumentation and Control Engineering',
  'Geology Engineering',
  'Water Resource Engineering'
];

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    positionId: '',
    department: '',
    gender: '',
    manifesto: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/admin/candidates');
      if (!response.ok) throw new Error('Failed to fetch candidates');
      const data = await response.json();
      setCandidates(data.candidates);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create candidate');
      }

      await fetchCandidates();
      setFormData({
        name: '',
        studentId: '',
        positionId: '',
        department: '',
        gender: '',
        manifesto: '',
        imageUrl: ''
      });
      setSuccess('Candidate added successfully');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;

    try {
      const res = await fetch(`/api/admin/candidates/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete candidate');
      }
      
      setSuccess('Candidate deleted successfully');
      fetchCandidates();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/admin" className={styles.backButton}>
          ← Back to Dashboard
        </Link>
        <h2 className={styles.header}>Candidate Management</h2>
      </div>

      {error && <div className={styles.alertError}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      <div className={styles.gridContainer}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Add New Candidate</h2>
          </div>
          <form onSubmit={handleSubmit} className={styles.cardContent}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="studentId" className={styles.formLabel}>Student ID</label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="positionId" className={styles.formLabel}>Position</label>
              <select
                id="positionId"
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
                required
                className={styles.formSelect}
              >
                <option value="">Select Position</option>
                {DEFAULT_POSITIONS.map(position => (
                  <option key={position.id} value={position.id}>
                    {position.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="department" className={styles.formLabel}>Department</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className={styles.formSelect}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="gender" className={styles.formLabel}>Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className={styles.formSelect}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="manifesto" className={styles.formLabel}>Manifesto</label>
              <textarea
                id="manifesto"
                name="manifesto"
                value={formData.manifesto}
                onChange={handleChange}
                required
                rows="4"
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="imageUrl" className={styles.formLabel}>Image URL (optional)</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className={styles.formInput}
              />
            </div>

            <button type="submit" className={styles.primaryButton} disabled={loading}>
              {loading ? 'Adding...' : 'Add Candidate'}
            </button>
          </form>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Current Candidates</h2>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.adminTable}>
              <thead>
                <tr className={styles.tableHeader}>
                  <th className={styles.tableCell}>Name</th>
                  <th className={styles.tableCell}>Student ID</th>
                  <th className={styles.tableCell}>Position</th>
                  <th className={styles.tableCell}>Department</th>
                  <th className={styles.tableCell}>Gender</th>
                  <th className={styles.tableCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(candidate => (
                  <tr key={candidate.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>{candidate.name}</td>
                    <td className={styles.tableCell}>{candidate.studentId}</td>
                    <td className={styles.tableCell}>
                      {DEFAULT_POSITIONS.find(p => p.id === candidate.positionId)?.title || candidate.positionId}
                    </td>
                    <td className={styles.tableCell}>{candidate.department}</td>
                    <td className={styles.tableCell}>{candidate.gender}</td>
                    <td className={styles.tableCell}>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className={styles.dangerButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 