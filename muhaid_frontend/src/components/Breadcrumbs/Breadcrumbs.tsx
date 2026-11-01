import { Fragment, type JSX } from 'react';
import { Link, type To } from 'react-router-dom';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  /** Keep the search params here, so the trail returns to a filtered list intact. */
  to?: To;
}

interface BreadcrumbsProps {
  /** Three levels at most, last item included. */
  items: BreadcrumbItem[];
  label?: string;
  className?: string;
}

export function Breadcrumbs({
  items,
  label,
  className,
}: BreadcrumbsProps): JSX.Element {
  const t = useT();
  return (
    <nav
      className={cx(styles.root, className)}
      aria-label={label ?? t.nav.breadcrumbs}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {last || item.to === undefined ? (
              <span
                className={cx(styles.crumb, last && styles.current)}
                aria-current={last ? 'page' : undefined}
                dir="auto"
              >
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className={styles.crumb} dir="auto">
                {item.label}
              </Link>
            )}
            {!last && (
              <span className={styles.separator} aria-hidden="true">
                <Icon name="chevronEnd" size={14} />
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
