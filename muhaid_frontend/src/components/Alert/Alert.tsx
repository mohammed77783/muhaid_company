import type { JSX, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './Alert.module.css';

type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'offline';

const ICONS: Record<AlertVariant, IconName> = {
  info: 'info',
  success: 'cloudCheck',
  warning: 'alert',
  error: 'alert',
  offline: 'wifiOff',
};

interface AlertProps {
  children?: ReactNode;
  title?: string;
  /** offline is the full-bleed connection banner; the rest are inline. */
  variant?: AlertVariant;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
}

/** Explains a state, its cause and the way forward, where it applies. */
export function Alert({
  children,
  title,
  variant = 'info',
  icon,
  action,
  className,
}: AlertProps): JSX.Element {
  return (
    <div
      className={cx(styles.root, styles[variant], className)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon name={icon ?? ICONS[variant]} size={18} className={styles.icon} />
      <div className={styles.grow}>
        {title && <strong className={styles.title}>{title}</strong>}
        {children && <span>{children}</span>}
      </div>
      {action}
    </div>
  );
}
