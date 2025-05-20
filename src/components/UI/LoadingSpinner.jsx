import styles from './ui.module.css';

export default function LoadingSpinner({ size = 'medium', light = false }) {
  return (
    <div className={`
      ${styles.spinner}
      ${styles[size]}
      ${light ? styles.light : ''}
    `}>
      <div className={styles.spinnerInner}></div>
    </div>
  );
}