import type { JSX, ReactNode } from 'react';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  /** The fields. Filters apply as they change; there is no Apply button. */
  children: ReactNode;
  className?: string;
}

export function FilterBar({
  children,
  className,
}: FilterBarProps): JSX.Element {
  return <div className={cx(styles.bar, className)}>{children}</div>;
}

interface FilterTagsProps {
  /** One FilterTag per applied filter, then a text button clearing them all. */
  children: ReactNode;
  className?: string;
}

/** The receipt: a table that silently hides rows is a table an admin will mistrust. */
export function FilterTags({
  children,
  className,
}: FilterTagsProps): JSX.Element {
  return <div className={cx(styles.tags, className)}>{children}</div>;
}

interface FilterTagProps {
  label: string;
  onRemove: () => void;
  removeLabel?: string;
  className?: string;
}

export function FilterTag({
  label,
  onRemove,
  removeLabel,
  className,
}: FilterTagProps): JSX.Element {
  const t = useT();
  return (
    <span className={cx(styles.tag, className)}>
      <span dir="auto">{label}</span>
      <button
        type="button"
        aria-label={`${removeLabel ?? t.filters.remove}: ${label}`}
        onClick={onRemove}
      >
        <Icon name="close" size={12} />
      </button>
    </span>
  );
}
