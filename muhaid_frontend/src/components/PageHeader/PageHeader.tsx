import type { JSX, ReactNode } from 'react';

import { Breadcrumbs, type BreadcrumbItem } from '../Breadcrumbs';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  /** The way back up, with the last item being this page. */
  breadcrumbs?: BreadcrumbItem[];
  title?: ReactNode;
  subtitle?: ReactNode;
  /** A dashboard page's commitments live here, not in the app bar. */
  actions?: ReactNode;
}

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
}: PageHeaderProps): JSX.Element {
  return (
    <header className={styles.root}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className={styles.row}>
        <div className={styles.heading}>
          {title && (
            <h1 className={styles.title} dir="auto">
              {title}
            </h1>
          )}
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
