import type { JSX } from 'react';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import styles from './StatusChip.module.css';
import { statusIcons, type Status } from './statusIcons';

interface StatusChipProps {
  status: Status;
  /** Overrides the built-in word. Use it to append a count, not to rename a state. */
  label?: string;
  size?: 'md' | 'sm';
  className?: string;
}

/** Status is never colour alone: every chip carries an icon and a word. */
export function StatusChip({
  status,
  label,
  size = 'md',
  className,
}: StatusChipProps): JSX.Element {
  const t = useT();
  return (
    <span
      className={cx(
        styles.root,
        styles[status],
        size === 'sm' && styles.sm,
        className,
      )}
    >
      <Icon name={statusIcons[status]} size={size === 'sm' ? 14 : 16} />
      <span>{label ?? t.status[status]}</span>
    </span>
  );
}
