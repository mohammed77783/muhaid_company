import type { JSX } from 'react';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { IconButton } from '../IconButton';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** 1-based, from the server. */
  page: number;
  pageCount: number;
  /** e.g. «48 نتيجة». */
  totalLabel?: string;
  onPageChange: (page: number) => void;
  /** Rows per page. The API rejects anything above 50. */
  limit?: number;
  limitOptions?: number[];
  onLimitChange?: (limit: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageCount,
  totalLabel,
  onPageChange,
  limit,
  limitOptions = [10, 20, 50],
  onLimitChange,
  className,
}: PaginationProps): JSX.Element {
  const t = useT();
  return (
    <div
      className={cx(styles.root, className)}
      role="navigation"
      aria-label={t.pagination.label}
    >
      {totalLabel && <span>{totalLabel}</span>}
      <span className={styles.spacer} />
      {limit !== undefined && onLimitChange && (
        <select
          className={styles.limit}
          value={limit}
          aria-label={t.pagination.perPage}
          title={t.pagination.perPage}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          {limitOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      <IconButton
        icon="arrowStart"
        size="sm"
        label={t.pagination.previous}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <span className={styles.page}>
        {page} / {pageCount}
      </span>
      <IconButton
        icon="arrowEnd"
        size="sm"
        label={t.pagination.next}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      />
    </div>
  );
}
