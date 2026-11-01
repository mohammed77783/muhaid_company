import type { JSX, ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  label?: ReactNode;
  checked?: boolean;
  /** The table "select all" state. Takes precedence over checked. */
  indeterminate?: boolean;
  disabled?: boolean;
  error?: boolean;
  onChange?: () => void;
  className?: string;
}

export function Checkbox({
  label,
  checked = false,
  indeterminate = false,
  disabled = false,
  error = false,
  onChange,
  className,
}: CheckboxProps): JSX.Element {
  return (
    <label
      className={cx(
        styles.root,
        (checked || indeterminate) && styles.checked,
        error && styles.error,
        disabled && styles.disabled,
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        disabled={disabled}
        onClick={onChange}
        className={styles.box}
      >
        {indeterminate ? (
          <Icon name="minus" size={14} />
        ) : (
          checked && <Icon name="check" size={14} />
        )}
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
