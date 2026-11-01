import type { ChangeEventHandler, JSX } from 'react';

import { cx } from '../../lib/cx';
import { Field, type FieldBaseProps } from '../Field';
import { Icon } from '../Icon';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends FieldBaseProps {
  name?: string;
  options: SelectOption[];
  value?: string;
  /** Shown as an empty first option, so the field can also mean "nothing chosen". */
  placeholder?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}

export function Select({
  name,
  options,
  value,
  placeholder,
  onChange,
  ...field
}: SelectProps): JSX.Element {
  return (
    <Field {...field} boxClassName={styles.box}>
      {({ id, describedBy, invalid, inputClassName, iconClassName }) => (
        <>
          <select
            id={id}
            name={name}
            disabled={field.disabled}
            // A value with no onChange is display-only, so keep it uncontrolled.
            value={onChange ? value : undefined}
            defaultValue={onChange ? undefined : value}
            onChange={onChange}
            className={cx(inputClassName, styles.select)}
            aria-required={field.required || undefined}
            aria-invalid={invalid}
            aria-describedby={describedBy}
          >
            {placeholder !== undefined && (
              <option value="">{placeholder}</option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevronDown"
            size={18}
            className={cx(iconClassName, styles.arrow)}
          />
        </>
      )}
    </Field>
  );
}
