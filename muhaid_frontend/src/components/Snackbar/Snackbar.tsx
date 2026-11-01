import type { JSX, ReactNode } from 'react';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './Snackbar.module.css';

export type SnackbarVariant = 'info' | 'success' | 'error';

const ICONS: Record<SnackbarVariant, IconName> = {
  info: 'info',
  success: 'cloudCheck',
  error: 'cloudFail',
};

interface SnackbarProps {
  /** Four to seven words. */
  message: ReactNode;
  variant?: SnackbarVariant;
  /** A failure always offers its recovery here. */
  actionLabel?: string;
  onAction?: () => void;
  /** Shows a close button: errors wait for the person, so they need a way out. */
  onDismiss?: () => void;
  className?: string;
}

/** The one inverted surface in the system: the app speaking, not part of the page. */
export function Snackbar({
  message,
  variant = 'info',
  actionLabel,
  onAction,
  onDismiss,
  className,
}: SnackbarProps): JSX.Element {
  const t = useT();
  return (
    <div
      className={cx(styles.root, styles[variant], className)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon name={ICONS[variant]} size={18} className={styles.icon} />
      <span className={styles.message}>{message}</span>
      {actionLabel && (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          className={styles.dismiss}
          aria-label={t.common.close}
          title={t.common.close}
          onClick={onDismiss}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
