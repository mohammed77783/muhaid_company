import type { JSX, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import styles from './Switch.module.css';

interface SwitchProps {
  label?: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  /** The word beside the track: a switch never signals with position alone. */
  stateText?: string;
  onChange?: () => void;
  className?: string;
}

export function Switch({
  label,
  checked = false,
  disabled = false,
  stateText,
  onChange,
  className,
}: SwitchProps): JSX.Element {
  return (
    <label
      className={cx(
        styles.root,
        checked && styles.on,
        disabled && styles.disabled,
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={styles.track}
      >
        <span className={styles.thumb} />
      </button>
      {label && <span>{label}</span>}
      {stateText && <span className={styles.state}>{stateText}</span>}
    </label>
  );
}
