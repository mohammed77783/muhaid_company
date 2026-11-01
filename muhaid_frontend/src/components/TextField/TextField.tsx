import type {
  ChangeEventHandler,
  ClipboardEventHandler,
  FocusEventHandler,
  HTMLInputAutoCompleteAttribute,
  HTMLInputTypeAttribute,
  JSX,
  KeyboardEventHandler,
} from 'react';

import { Field, type FieldBaseProps } from '../Field';
import { Icon, type IconName } from '../Icon';

type TextElement = HTMLInputElement | HTMLTextAreaElement;

interface TextFieldProps extends FieldBaseProps {
  name?: string;
  /** A name for screen readers, for a field in a list with no visible label. */
  ariaLabel?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  readOnly?: boolean;
  multiline?: boolean;
  rows?: number;
  /** Renders the input in IBM Plex Mono with tabular figures: codes and work orders. */
  code?: boolean;
  startIcon?: IconName;
  endIcon?: IconName;
  /** Direction of the input alone. Defaults to "ltr" for code, else "auto" for user text. */
  inputDir?: 'rtl' | 'ltr' | 'auto';
  inputMode?: 'text' | 'email' | 'numeric' | 'search' | 'tel' | 'url' | 'none';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  autoFocus?: boolean;
  maxLength?: number;
  onChange?: ChangeEventHandler<TextElement>;
  onBlur?: FocusEventHandler<TextElement>;
  onKeyDown?: KeyboardEventHandler<TextElement>;
  onPaste?: ClipboardEventHandler<TextElement>;
}

export function TextField({
  name,
  ariaLabel,
  value,
  defaultValue,
  placeholder,
  type = 'text',
  readOnly,
  multiline = false,
  rows = 3,
  code = false,
  startIcon,
  endIcon,
  inputDir,
  inputMode,
  autoComplete,
  autoFocus,
  maxLength,
  onChange,
  onBlur,
  onKeyDown,
  onPaste,
  ...field
}: TextFieldProps): JSX.Element {
  return (
    <Field {...field} code={code}>
      {({ id, describedBy, invalid, inputClassName, iconClassName }) => {
        const common = {
          id,
          name,
          value,
          defaultValue,
          placeholder,
          disabled: field.disabled,
          // A value with no onChange is a display-only field, not a React warning.
          readOnly: readOnly || (value != null && !onChange) || undefined,
          autoFocus,
          maxLength,
          dir: inputDir ?? (code ? 'ltr' : 'auto'),
          className: inputClassName,
          onChange,
          onBlur,
          onKeyDown,
          onPaste,
          'aria-label': ariaLabel,
          'aria-required': field.required || undefined,
          'aria-invalid': invalid,
          'aria-describedby': describedBy,
        };
        return (
          <>
            {startIcon && (
              <Icon name={startIcon} size={18} className={iconClassName} />
            )}
            {multiline ? (
              <textarea {...common} rows={rows} />
            ) : (
              <input
                {...common}
                type={type}
                inputMode={inputMode}
                autoComplete={autoComplete}
              />
            )}
            {endIcon && (
              <Icon name={endIcon} size={18} className={iconClassName} />
            )}
          </>
        );
      }}
    </Field>
  );
}
