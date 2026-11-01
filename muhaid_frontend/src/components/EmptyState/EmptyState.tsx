import type { JSX, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  /** A fact: what is empty. */
  title: ReactNode;
  /** An instruction: what to do next. */
  body?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  body,
  icon,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div className={cx(styles.root, className)}>
      {icon && (
        <div className={styles.mark}>
          <Icon name={icon} size={26} />
        </div>
      )}
      <div className={styles.title}>{title}</div>
      {body && <div className={styles.body}>{body}</div>}
      {action}
    </div>
  );
}
