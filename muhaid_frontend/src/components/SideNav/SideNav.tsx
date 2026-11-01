import type { JSX } from 'react';
import { NavLink } from 'react-router-dom';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './SideNav.module.css';

export interface SideNavItem {
  id: string;
  icon: IconName;
  label: string;
  to: string;
  /** A tabular count at the end of the row. */
  count?: number;
}

interface SideNavProps {
  items: SideNavItem[];
  brand?: string;
  label?: string;
  /** Lets a drawer close itself when a destination is chosen. */
  onNavigate?: () => void;
  className?: string;
}

/** NavLink sets aria-current="page" on the active item; the styling follows it. */
export function SideNav({
  items,
  brand,
  label,
  onNavigate,
  className,
}: SideNavProps): JSX.Element {
  const t = useT();
  return (
    <nav
      className={cx(styles.root, className)}
      aria-label={label ?? t.nav.main}
    >
      <div className={styles.brand}>
        <Icon name="hardhat" size={24} className={styles.brandIcon} />
        {brand && <span className={styles.word}>{brand}</span>}
      </div>
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          className={styles.item}
          onClick={onNavigate}
        >
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
          {item.count != null && (
            <span className={styles.count}>{item.count}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
