import type { JSX } from 'react';

import { cx } from '../../lib/cx';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** 0–100. Omit with indeterminate. */
  value?: number;
  indeterminate?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value = 0,
  indeterminate = false,
  label,
  className,
}: ProgressBarProps): JSX.Element {
  return (
    <div
      className={cx(
        styles.root,
        indeterminate && styles.indeterminate,
        className,
      )}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={styles.fill}
        style={indeterminate ? undefined : { width: `${value}%` }}
      />
    </div>
  );
}
