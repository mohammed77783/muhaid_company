import { useId, type JSX, type ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import styles from './Field.module.css';

export interface FieldBaseProps {
  label?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Any truthy value puts the field in its error state and replaces helperText. */
  error?: string | null;
  /** e.g. "24/280". Rendered tabular, at the end of the helper row. */
  counter?: string;
  className?: string;
}

export interface FieldControlProps {
  id: string;
  /** Spread onto the input, select or textarea. */
  describedBy: string | undefined;
  invalid: true | undefined;
  inputClassName: string;
  iconClassName: string;
}

interface FieldProps extends FieldBaseProps {
  /** Monospaced, tabular input: codes, work orders and dates. */
  code?: boolean;
  boxClassName?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** The shell every text-like field shares: label, control box, helper or error line. */
export function Field({
  label,
  id,
  required = false,
  disabled = false,
  helperText,
  error,
  counter,
  className,
  code = false,
  boxClassName,
  children,
}: FieldProps): JSX.Element {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const helpId = `${controlId}-help`;
  const hasHelp = Boolean(error || helperText || counter);

  return (
    <div
      className={cx(
        styles.root,
        error && styles.error,
        disabled && styles.disabled,
        className,
      )}
    >
      {label && (
        <label className={styles.label} htmlFor={controlId}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className={cx(styles.box, boxClassName)}>
        {children({
          id: controlId,
          describedBy: hasHelp ? helpId : undefined,
          invalid: error ? true : undefined,
          inputClassName: cx(styles.input, code && styles.code),
          iconClassName: styles.icon,
        })}
      </div>
      {hasHelp && (
        <div id={helpId} className={cx(styles.help, error && styles.helpError)}>
          {error && <Icon name="alert" size={14} />}
          <span>{error || helperText}</span>
          {counter && <span className={styles.count}>{counter}</span>}
        </div>
      )}
    </div>
  );
}
