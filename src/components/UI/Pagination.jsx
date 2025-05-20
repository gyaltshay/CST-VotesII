
import styles from './Pagination.module.css';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5,
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    let pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className={styles.pagination}>
      {showFirstLast && currentPage > 1 && (
        <button
          className={styles.pageButton}
          onClick={() => onPageChange(1)}
        >
          «
        </button>
      )}

      <button
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>

      {getPageNumbers().map(page => (
        <button
          key={page}
          className={`${styles.pageButton} ${
            page === currentPage ? styles.active : ''
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className={styles.pageButton}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>

      {showFirstLast && currentPage < totalPages && (
        <button
          className={styles.pageButton}
          onClick={() => onPageChange(totalPages)}
        >
          »
        </button>
      )}
    </div>
  );
}