"use client";
import { useEffect, useState } from "react";
import adminStyles from "../admin.module.css";
import styles from './supportMessages.module.css';
import Link from 'next/link';

const statusOptions = ["PENDING", "IN_PROGRESS", "RESOLVED"];

export default function AdminSupportMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, current: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line
  }, [status, search, page]);

  async function fetchMessages() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, status, search });
      const res = await fetch(`/api/admin/support-messages?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to fetch messages");
      }
      
      setMessages(data.messages || []);
      setPagination(data.pagination || { total: 0, pages: 1, current: 1 });
    } catch (e) {
      console.error("Error fetching messages:", e);
      setError(e.message || "Failed to fetch messages. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/support-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to update status");
      }
      
      setSuccess("Status updated successfully");
      fetchMessages();
    } catch (e) {
      console.error("Error updating status:", e);
      setError(e.message || "Failed to update status. Please try again later.");
    }
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.headerContainer}>
        <Link href="/admin" className={styles.backButton}>
          ← Back to Dashboard
        </Link>
        <h2 className={styles.adminHeader}>Support Messages</h2>
      </div>
      <div className={styles.filterContainer}>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)} 
          className={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          {statusOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by subject, message, name, or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      {loading ? (
        <div className={styles.loadingText}>Loading...</div>
      ) : error ? (
        <div className={styles.alertError}>{error}</div>
      ) : (
        <>
          {success && <div className={styles.alertSuccess}>{success}</div>}
          {messages.length === 0 ? (
            <div className={styles.noMessages}>No messages found</div>
          ) : (
            <>
              <table className={styles.adminTable}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.tableCell}>Name</th>
                    <th className={styles.tableCell}>Email</th>
                    <th className={styles.tableCell}>Subject</th>
                    <th className={styles.tableCell}>Message</th>
                    <th className={styles.tableCell}>Status</th>
                    <th className={styles.tableCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map(msg => (
                    <tr key={msg.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>{msg.name}</td>
                      <td className={styles.tableCell}>{msg.email}</td>
                      <td className={styles.tableCell}>{msg.subject}</td>
                      <td className={`${styles.tableCell} ${styles.truncatedCell}`} title={msg.message}>
                        {msg.message}
                      </td>
                      <td className={styles.tableCell}>{msg.status}</td>
                      <td className={styles.tableCell}>
                        <select
                          value={msg.status}
                          onChange={e => handleStatusChange(msg.id, e.target.value)}
                          className={styles.statusSelect}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.paginationContainer}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.current === 1}
                  className={styles.paginationButton}
                >
                  Prev
                </button>
                <span className={styles.paginationText}>
                  Page {pagination.current} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={pagination.current === pagination.pages}
                  className={styles.paginationButton}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
} 