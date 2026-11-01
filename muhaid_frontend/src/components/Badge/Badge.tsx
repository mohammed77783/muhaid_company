import type { JSX, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import styles from './Badge.module.css';

interface BadgeProps {
  children: ReactNode;
  count: number;
  /** Over this, renders "max+". */
  max?: number;
  /** Grey instead of the finding colour: a neutral count such as unread items. */
  quiet?: boolean;
  label?: string;
  className?: string;
}

export function Badge({
  children,
  count,
  max,
  quiet = false,
  label,
  className,
}: BadgeProps): JSX.Element {
  const text = max && count > max ? `${max}+` : String(count);
  return (
    <span className={cx(styles.root, className)}>
      {children}
      {count > 0 && (
        <span
          className={cx(styles.count, quiet && styles.quiet)}
          aria-label={label ? `${label}: ${text}` : undefined}
        >
          {text}
        </span>
      )}
    </span>
  );
}
