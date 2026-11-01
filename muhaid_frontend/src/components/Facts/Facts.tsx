import type { JSX, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import styles from './Facts.module.css';

export function Facts({ children }: { children: ReactNode }): JSX.Element {
  return <dl className={styles.root}>{children}</dl>;
}

interface FactProps {
  label: string;
  children: ReactNode;
  /** Monospaced: codes, work orders. */
  code?: boolean;
}

export function Fact({
  label,
  children,
  code = false,
}: FactProps): JSX.Element {
  return (
    <div>
      <dt className={styles.label}>{label}</dt>
      <dd className={cx(styles.value, code && 'code')} dir="auto">
        {children}
      </dd>
    </div>
  );
}
