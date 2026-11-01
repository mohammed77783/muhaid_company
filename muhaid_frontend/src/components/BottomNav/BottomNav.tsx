import type { JSX } from 'react';
import { NavLink } from 'react-router-dom';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Badge } from '../Badge';
import { Icon, type IconName } from '../Icon';
import styles from './BottomNav.module.css';

export interface BottomNavItem {
  id: string;
  icon: IconName;
  label: string;
  to: string;
  /** The outbox badge: pending work stays visible from any screen. */
  badge?: number;
}

interface BottomNavProps {
  items: BottomNavItem[];
  label?: string;
  className?: string;
}

/** Labels always show: an icon-only bar is unreadable at arm's length in sunlight. */
export function BottomNav({
  items,
  label,
  className,
}: BottomNavProps): JSX.Element {
  const t = useT();
  return (
    <nav
      className={cx(styles.root, className)}
      aria-label={label ?? t.nav.main}
    >
      {items.map((item) => (
        <NavLink key={item.id} to={item.to} className={styles.item}>
          <Badge count={item.badge ?? 0} max={99} label={item.label}>
            <Icon name={item.icon} size={22} />
          </Badge>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
