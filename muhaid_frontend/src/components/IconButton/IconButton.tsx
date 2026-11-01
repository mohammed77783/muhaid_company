import type { ComponentPropsWithRef, JSX } from 'react';

import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './IconButton.module.css';

interface IconButtonProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children'
> {
  icon: IconName;
  /** Required: it becomes both aria-label and the tooltip. */
  label: string;
  variant?: 'outlined' | 'danger' | 'onbrand';
  size?: 'md' | 'sm';
}

export function IconButton({
  icon,
  label,
  variant,
  size = 'md',
  type = 'button',
  className,
  ...rest
}: IconButtonProps): JSX.Element {
  return (
    <button
      {...rest}
      type={type}
      className={cx(
        styles.root,
        variant && styles[variant],
        size === 'sm' && styles.sm,
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 20} />
    </button>
  );
}
