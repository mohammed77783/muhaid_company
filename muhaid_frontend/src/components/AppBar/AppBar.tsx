import type { JSX, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import styles from './AppBar.module.css';

interface AppBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** plain = ink on surface with a hairline, for the dashboard. Default is the brand fill. */
  plain?: boolean;
  /** One back affordance, using the arrowStart glyph. */
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
}

export function AppBar({
  title,
  subtitle,
  plain = false,
  start,
  end,
  className,
}: AppBarProps): JSX.Element {
  return (
    <header className={cx(styles.root, plain && styles.plain, className)}>
      {start}
      <div className={styles.title}>
        <div className={styles.line} dir="auto">
          {title}
        </div>
        {subtitle && (
          <div className={cx(styles.line, styles.subtitle)}>{subtitle}</div>
        )}
      </div>
      {end}
    </header>
  );
}
