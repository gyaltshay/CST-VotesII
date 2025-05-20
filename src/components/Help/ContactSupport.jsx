import { useState } from 'react';
import styles from './Help.module.css';

export function ContactSupport() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to send message. Please try again later.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={styles.contact}>
      <h2 className={styles.sectionTitle}>Need More Help?</h2>
      
      <div className={styles.contactInfo}>
        <div className={styles.contactCard}>
          <h3>Contact Information</h3>
          <p><strong>Email:</strong> support@cstvotes.edu.bt</p>
          <p><strong>Phone:</strong> +975-17-123456</p>
          <p><strong>Location:</strong> IT Help Desk, Administration Building</p>
          <p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM</p>
        </div>

        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Name</label>
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
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              pattern="^\d{8}\.cst@rub\.edu\.bt$"
              placeholder="12345678.cst@rub.edu.bt"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              className={styles.textarea}
              rows="5"
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {status === 'success' && (
            <div className={styles.successMessage}>
              Message sent successfully! We'll get back to you soon.
            </div>
          )}

          {status === 'error' && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}