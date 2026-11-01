import type { ChangeEventHandler, JSX } from 'react';

import type { CalendarDate } from '../../types/api';
import { cx } from '../../lib/cx';
import { Field, type FieldBaseProps } from '../Field';
import { Icon } from '../Icon';
import styles from './DatePicker.module.css';

interface DatePickerProps extends FieldBaseProps {
  name?: string;
  /** Always "YYYY-MM-DD", or empty. Stays a string, so no timezone can shift the day. */
  value?: CalendarDate;
  min?: CalendarDate;
  max?: CalendarDate;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

/** The browser's own date input: its value is already an ISO calendar date. */
export function DatePicker({
  name,
  value,
  min,
  max,
  onChange,
  ...field
}: DatePickerProps): JSX.Element {
  return (
    <Field {...field} code boxClassName={styles.box}>
      {({ id, describedBy, invalid, inputClassName, iconClassName }) => (
        <>
          <Icon name="calendar" size={18} className={iconClassName} />
          <input
            id={id}
            name={name}
            type="date"
            dir="ltr"
            value={value}
            min={min}
            max={max}
            disabled={field.disabled}
            readOnly={value != null && !onChange ? true : undefined}
            onChange={onChange}
            className={cx(inputClassName, styles.input)}
            aria-required={field.required || undefined}
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        </>
      )}
    </Field>
  );
}
