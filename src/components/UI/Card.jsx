import styles from './Card.module.css';

export default function Card({
  children,
  title,
  subtitle,
  footer,
  className,
  hoverable = false,
  ...props
}) {
  return (
    <div 
      className={`
        ${styles.card} 
        ${hoverable ? styles.hoverable : ''} 
        ${className || ''}
      `}
      {...props}
    >
      {(title || subtitle) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
}