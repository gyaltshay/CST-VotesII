'use client';
import { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function SupportMessages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/admin/support-messages');
            const data = await response.json();
            
            if (response.ok) {
                setMessages(data.messages);
            } else {
                throw new Error(data.message || 'Failed to fetch messages');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateMessageStatus = async (messageId, newStatus) => {
        try {
            const response = await fetch(`/api/admin/support-messages/${messageId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(messages.map(msg => 
                    msg.id === messageId ? { ...msg, status: newStatus } : msg
                ));
            } else {
                throw new Error(data.message || 'Failed to update message status');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const filteredMessages = selectedStatus === 'all'
        ? messages
        : messages.filter(msg => msg.status === selectedStatus);

    if (loading) return <div className={styles.loading}>Loading messages...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.supportMessagesContainer}>
            <h2 className={styles.formTitle}>Support Messages</h2>
            
            <div className={styles.filterContainer}>
                <label htmlFor="statusFilter">Filter by status:</label>
                <select
                    id="statusFilter"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={styles.select}
                >
                    <option value="all">All Messages</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                </select>
            </div>

            <div className={styles.messagesList}>
                {filteredMessages.length === 0 ? (
                    <p className={styles.noMessages}>No messages found</p>
                ) : (
                    filteredMessages.map((message) => (
                        <div key={message.id} className={styles.messageCard}>
                            <div className={styles.messageHeader}>
                                <h3>{message.subject}</h3>
                                <span className={`${styles.status} ${styles[message.status.toLowerCase()]}`}>
                                    {message.status}
                                </span>
                            </div>
                            <div className={styles.messageInfo}>
                                <p><strong>From:</strong> {message.name} ({message.email})</p>
                                <p><strong>Date:</strong> {new Date(message.createdAt).toLocaleString()}</p>
                            </div>
                            <p className={styles.messageContent}>{message.message}</p>
                            <div className={styles.messageActions}>
                                <select
                                    value={message.status}
                                    onChange={(e) => updateMessageStatus(message.id, e.target.value)}
                                    className={styles.statusSelect}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
} 