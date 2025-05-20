import { useEffect, useState } from 'react';
import styles from './ui.module.css';

export default function Alert({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      <span className={styles.message}>{message}</span>
      {!duration && (
        <button 
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className={styles.closeButton}
        >
          ×
        </button>
      )}
    </div>
  );
}