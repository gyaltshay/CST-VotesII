import styles from './ui.module.css';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = ''
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className} ${loading ? styles.loading : ''}`}
    >
      {loading ? (
        <span className={styles.spinner}></span>
      ) : children}
    </button>
  );
}