'use client';
import { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function VotingTimeManager() {
    const [votingEndTime, setVotingEndTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

    useEffect(() => {
        // Fetch current voting end time when component mounts
        fetchVotingEndTime();
    }, []);

    const fetchVotingEndTime = async () => {
        try {
            const response = await fetch('/api/admin/voting-time');
            const data = await response.json();
            if (data.endTime) {
                // Convert to local datetime-local format
                const localDateTime = new Date(data.endTime).toISOString().slice(0, 16);
                setVotingEndTime(localDateTime);
            }
        } catch (error) {
            setMessage({ type: 'error', content: 'Failed to fetch voting end time' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        try {
            const response = await fetch('/api/admin/voting-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ endTime: new Date(votingEndTime).toISOString() }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', content: 'Voting end time updated successfully' });
            } else {
                throw new Error(data.message || 'Failed to update voting end time');
            }
        } catch (error) {
            setMessage({ type: 'error', content: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2 className={styles.formTitle}>Manage Voting End Time</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="votingEndTime">Voting End Time:</label>
                    <input
                        type="datetime-local"
                        id="votingEndTime"
                        value={votingEndTime}
                        onChange={(e) => setVotingEndTime(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                {message.content && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.content}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitButton}
                >
                    {loading ? 'Updating...' : 'Update Voting End Time'}
                </button>
            </form>
        </div>
    );
} 