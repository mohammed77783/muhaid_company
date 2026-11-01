import type { JSX, MouseEvent, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { EmptyState, type EmptyStateProps } from '../EmptyState';
import { Pagination, type PaginationProps } from '../Pagination';
import { Skeleton } from '../Skeleton';
import styles from './DataTable.module.css';

export interface Column<Row> {
  key: string;
  label: string;
  width?: string | number;
  /** Tabular figures, for dates and counts. Never right-aligned. */
  numeric?: boolean;
  /** Renders the cell in IBM Plex Mono: project codes, work orders, IDs. */
  code?: boolean;
  className?: string;
  render: (row: Row) => ReactNode;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows?: Row[];
  getRowKey: (row: Row) => string;
  /** Mouse convenience: keep a real link in the row for keyboard and screen readers. */
  onRowClick?: (row: Row) => void;
  /** Greys a row out, e.g. a deactivated user. */
  isRowDimmed?: (row: Row) => boolean;
  /** Replaces the body with skeleton rows, never a blocking spinner. */
  loading?: boolean;
  skeletonRows?: number;
  /** Dims the current rows while the next page loads in a transition. */
  pending?: boolean;
  /** What EmptyState says when rows is empty: a fact, then an instruction. */
  empty: EmptyStateProps;
  /** Server-side paging only. Omit to hide the footer. */
  pagination?: PaginationProps;
  className?: string;
}

const SKELETON_WIDTHS = ['68%', '90%', '54%', '76%', '44%'];
const INTERACTIVE = 'a, button, input, select, textarea, label';

export function DataTable<Row>({
  columns,
  rows = [],
  getRowKey,
  onRowClick,
  isRowDimmed,
  loading = false,
  skeletonRows = 5,
  pending = false,
  empty,
  pagination,
  className,
}: DataTableProps<Row>): JSX.Element {
  function handleRowClick(e: MouseEvent<HTMLTableRowElement>, row: Row): void {
    // A link or button inside the row keeps its own click.
    if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
    onRowClick?.(row);
  }

  return (
    <div className={cx(styles.root, pending && styles.pending, className)}>
      <div className={styles.scroll}>
        <table className={styles.table} aria-busy={loading || pending}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={c.numeric ? styles.numeric : undefined}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }, (_, r) => (
                <tr key={r}>
                  {columns.map((c, i) => (
                    <td key={c.key}>
                      <Skeleton
                        width={SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  <EmptyState {...empty} />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className={
                    cx(
                      onRowClick && styles.clickable,
                      isRowDimmed?.(row) && styles.dimmed,
                    ) || undefined
                  }
                  onClick={
                    onRowClick ? (e) => handleRowClick(e, row) : undefined
                  }
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={
                        cx(
                          c.numeric && styles.numeric,
                          c.code && styles.code,
                          c.className,
                        ) || undefined
                      }
                      style={c.width ? { width: c.width } : undefined}
                    >
                      {c.numeric || c.code ? (
                        // Isolated inside the cell, which keeps the page's direction, so
                        // the value lines up with its column head in RTL too.
                        <span className={styles.ltr}>{c.render(row)}</span>
                      ) : (
                        c.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.pageCount > 0 && (
        <Pagination {...pagination} className={styles.footer} />
      )}
    </div>
  );
}
