"use client";
import { useEffect, useState } from "react";
import styles from './users.module.css';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [page, filter, search]);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, filter, search });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone and will delete all associated data (votes, sessions, etc.).")) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      
      setSuccess("User deleted successfully");
      fetchUsers();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/admin" className={styles.backButton}>
          ← Back to Dashboard
        </Link>
        <h2 className={styles.header}>User Management</h2>
      </div>
      <div className={styles.filterContainer}>
        <select value={filter} onChange={e => setFilter(e.target.value)} className={styles.filterSelect}>
          <option value="all">All Users</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
        <input
          type="text"
          placeholder="Search by name, email, student ID, or department"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      {success && <div className={styles.alertSuccess}>{success}</div>}
      {error && <div className={styles.alertError}>{error}</div>}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.tableCell}>Name</th>
              <th className={styles.tableCell}>Email</th>
              <th className={styles.tableCell}>Student ID</th>
              <th className={styles.tableCell}>Department</th>
              <th className={styles.tableCell}>Year</th>
              <th className={styles.tableCell}>Gender</th>
              <th className={styles.tableCell}>Role</th>
              <th className={styles.tableCell}>Status</th>
              <th className={styles.tableCell}>Votes</th>
              <th className={styles.tableCell}>Created</th>
              <th className={styles.tableCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.userInfo}>
                    {user.image && (
                      <img 
                        src={user.image} 
                        alt={user.name} 
                        className={styles.userImage}
                      />
                    )}
                    <span>{user.name}</span>
                  </div>
                </td>
                <td className={styles.tableCell}>{user.email}</td>
                <td className={styles.tableCell}>{user.studentId}</td>
                <td className={styles.tableCell}>{user.department}</td>
                <td className={styles.tableCell}>{user.yearOfStudy}</td>
                <td className={styles.tableCell}>{user.gender}</td>
                <td className={styles.tableCell}>{user.role}</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.status} ${user.emailVerified ? styles.verified : styles.unverified}`}>
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className={styles.tableCell}>{user._count?.votes || 0}</td>
                <td className={styles.tableCell}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className={styles.tableCell}>
                  {user.role !== "ADMIN" && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className={styles.deleteButton}
                      title="Delete user and all associated data"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.paginationContainer}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className={styles.paginationButton}
        >
          Previous
        </button>
        <span className={styles.paginationText}>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className={styles.paginationButton}
        >
          Next
        </button>
      </div>
    </div>
  );
} 