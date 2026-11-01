import type { JSX } from 'react';

import { cx } from '../../lib/cx';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'text' | 'block' | 'chip' | 'card';
  /** Renders n stacked text lines, the last one short. Overrides variant. */
  lines?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/** The shape a screen is about to become. Never a spinner that blocks the page. */
export function Skeleton({
  variant = 'text',
  lines,
  width,
  height,
  className,
}: SkeletonProps): JSX.Element {
  if (lines) {
    return (
      <div className={className} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cx(styles.bone, styles.text)}
            style={{ width: i === lines - 1 ? '52%' : '100%' }}
          />
        ))}
      </div>
    );
  }
  if (variant === 'card') {
    return (
      <div className={cx(styles.card, className)} aria-hidden="true">
        <div className={styles.cardGrow}>
          <div
            className={cx(styles.bone, styles.text)}
            style={{ width: '62%', height: 18 }}
          />
          <div
            className={cx(styles.bone, styles.text)}
            style={{ width: '38%' }}
          />
        </div>
        <div className={cx(styles.bone, styles.chip)} />
      </div>
    );
  }
  return (
    <div
      className={cx(styles.bone, styles[variant], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
