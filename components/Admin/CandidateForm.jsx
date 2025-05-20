'use client';

import { useState } from 'react';
import styles from './admin.module.css';

export default function CandidateForm({ positions, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    gender: '',
    manifesto: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Prepare for upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const { url } = await response.json();
      setFormData(prev => ({
        ...prev,
        imageUrl: url
      }));
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
        throw new Error(error.message || 'Failed to add candidate');
      }

      // Reset form
      setFormData({
        name: '',
        position: '',
        department: '',
        gender: '',
        manifesto: '',
        imageUrl: ''
      });
      setImagePreview('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.formGroup}>
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="position">Position</label>
        <select
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          required
          className={styles.select}
        >
          <option value="">Select Position</option>
          {positions?.map(position => (
            <option key={position.id} value={position.id}>
              {position.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="department">Department</label>
        <input
          type="text"
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="gender">Gender</label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
          className={styles.select}
        >
          <option value="">Select Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="manifesto">Manifesto</label>
        <textarea
          id="manifesto"
          name="manifesto"
          value={formData.manifesto}
          onChange={handleChange}
          required
          className={styles.textarea}
          rows={5}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="image">Profile Image</label>
        <input
          type="file"
          id="image"
          name="image"
          onChange={handleImageChange}
          accept="image/*"
          className={styles.fileInput}
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className={styles.imagePreview}
          />
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? 'Adding Candidate...' : 'Add Candidate'}
      </button>
    </form>
  );
} 