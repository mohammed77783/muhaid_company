import { useMemo, useRef, useState, type JSX, type KeyboardEvent } from 'react';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Field, type FieldBaseProps } from '../Field';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import styles from './Autocomplete.module.css';

export interface AutocompleteOption {
  value: string;
  label: string;
  /** A project code or similar, shown monospaced and also matched by the filter. */
  code?: string;
}

interface AutocompleteProps extends FieldBaseProps {
  options: AutocompleteOption[];
  /** The selected option's value; empty means nothing is selected. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  /** Offers a clear button while something is selected. */
  clearable?: boolean;
}

function matches(option: AutocompleteOption, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  return (
    option.label.toLocaleLowerCase().includes(q) ||
    (option.code?.toLocaleLowerCase().includes(q) ?? false)
  );
}

/**
 * A type-to-filter picker, keyboard operable as a WAI-ARIA combobox. It filters only the
 * options it was given: the API has no text search, so the caller loads the list.
 */
export function Autocomplete({
  options,
  value,
  onChange,
  placeholder,
  emptyText,
  clearable = false,
  ...field
}: AutocompleteProps): JSX.Element {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const visible = useMemo(
    () => options.filter((o) => matches(o, query)),
    [options, query],
  );

  function close(): void {
    setOpen(false);
    setQuery('');
    setActive(0);
  }

  function choose(option: AutocompleteOption): void {
    onChange(option.value);
    close();
  }

  function moveActive(next: number): void {
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (visible.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      moveActive((active + step + visible.length) % visible.length);
      return;
    }
    if (e.key === 'Enter' && open) {
      // Inside a form, Enter picks an option rather than submitting.
      e.preventDefault();
      const option = visible[active];
      if (option) choose(option);
    }
  }

  return (
    <div className={styles.root}>
      <Field {...field}>
        {({ id, describedBy, invalid, inputClassName, iconClassName }) => {
          const listId = `${id}-list`;
          return (
            <>
              <Icon name="search" size={18} className={iconClassName} />
              <input
                id={id}
                type="text"
                dir="auto"
                role="combobox"
                autoComplete="off"
                disabled={field.disabled}
                className={inputClassName}
                placeholder={selected?.label ?? placeholder}
                value={open ? query : (selected?.label ?? '')}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onBlur={close}
                onKeyDown={handleKeyDown}
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  open && visible[active] ? `${listId}-${active}` : undefined
                }
                aria-required={field.required || undefined}
                aria-invalid={invalid}
                aria-describedby={describedBy}
              />
              {clearable && selected && !field.disabled ? (
                <IconButton
                  icon="close"
                  size="sm"
                  label={t.common.clear}
                  // Leaves focus where it is, so clearing doesn't also open the list.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onChange('')}
                />
              ) : (
                <Icon name="chevronDown" size={18} className={iconClassName} />
              )}
              {open && (
                <div
                  ref={listRef}
                  id={listId}
                  role="listbox"
                  className={styles.popover}
                  // Keeps focus in the input while the list is clicked or scrolled.
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {visible.length === 0 ? (
                    <div className={cx(styles.option, styles.empty)}>
                      {emptyText ?? t.common.noResults}
                    </div>
                  ) : (
                    visible.map((option, i) => (
                      <div
                        key={option.value}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={option.value === value}
                        className={cx(
                          styles.option,
                          i === active && styles.active,
                        )}
                        onClick={() => choose(option)}
                        onMouseEnter={() => setActive(i)}
                      >
                        <span dir="auto">{option.label}</span>
                        {option.code && (
                          <span className={cx('code', styles.code)}>
                            {option.code}
                          </span>
                        )}
                        {option.value === value && (
                          <Icon
                            name="check"
                            size={16}
                            className={styles.mark}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          );
        }}
      </Field>
    </div>
  );
}
