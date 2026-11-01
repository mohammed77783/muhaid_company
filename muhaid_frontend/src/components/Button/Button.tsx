import type { ComponentPropsWithRef, JSX, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './Button.module.css';

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  children: ReactNode;
  /** primary = the one commitment on the screen; danger = destructive and confirmed. */
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  /** sm is for a table row, chip or snackbar only, never for a field-app action. */
  size?: 'md' | 'sm';
  /** Swaps the label for a spinner and blocks input. */
  loading?: boolean;
  /** What a screen reader hears while loading. Defaults to a string label. */
  loadingLabel?: string;
  startIcon?: IconName;
  endIcon?: IconName;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  loading = false,
  loadingLabel,
  startIcon,
  endIcon,
  fullWidth = false,
  className,
  ...rest
}: ButtonProps): JSX.Element {
  const iconSize = size === 'sm' ? 16 : 18;
  return (
    <button
      {...rest}
      type={type}
      className={cx(
        styles.root,
        styles[variant],
        size === 'sm' && styles.sm,
        fullWidth && styles.block,
        loading && styles.loading,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={
        loading
          ? (loadingLabel ??
            (typeof children === 'string' ? children : rest['aria-label']))
          : rest['aria-label']
      }
    >
      {startIcon && <Icon name={startIcon} size={iconSize} />}
      <span>{children}</span>
      {endIcon && <Icon name={endIcon} size={iconSize} />}
      {loading && <span className={styles.spin} />}
    </button>
  );
}
