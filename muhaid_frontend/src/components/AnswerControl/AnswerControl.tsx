import {
  useState,
  type ChangeEventHandler,
  type JSX,
  type KeyboardEvent,
} from 'react';

import { useLang, useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import type { AnswerValue } from '../../types/api';
import { Button } from '../Button';
import { Icon, type IconName } from '../Icon';
import { TextField } from '../TextField';
import styles from './AnswerControl.module.css';

/* Yes, No, N/A in that order in both directions: the grid mirrors itself. */
const ANSWERS: { value: AnswerValue; icon: IconName }[] = [
  { value: 'yes', icon: 'check' },
  { value: 'no', icon: 'close' },
  { value: 'na', icon: 'minus' },
];

type NoteElement = HTMLInputElement | HTMLTextAreaElement;

interface AnswerControlProps {
  question?: string;
  /** 1-based position, shown monospaced before the question. */
  index?: number;
  value?: AnswerValue | null;
  onChange?: (value: AnswerValue) => void;
  disabled?: boolean;
  /** A question left unanswered when the inspector tried to save. */
  error?: string | null;
  note?: string;
  noteError?: string | null;
  noteCounter?: string;
  onNoteChange?: ChangeEventHandler<NoteElement>;
  className?: string;
}

/**
 * Three 64px targets for a gloved hand. A "No" opens a required note. The API also takes
 * a note on Yes and N/A, so those offer an optional one behind a button.
 */
export function AnswerControl({
  question,
  index,
  value = null,
  onChange,
  disabled = false,
  error,
  note = '',
  noteError,
  noteCounter,
  onNoteChange,
  className,
}: AnswerControlProps): JSX.Element {
  const t = useT();
  const { dir } = useLang();
  const [optionalNoteOpen, setOptionalNoteOpen] = useState(false);

  const answered = value !== null;
  const showOptionalNote =
    answered && value !== 'no' && (optionalNoteOpen || note !== '');

  // A radiogroup is one tab stop: arrow keys move and select within it.
  const tabStop = value ?? 'yes';

  function handleKeyDown(
    e: KeyboardEvent<HTMLButtonElement>,
    current: number,
  ): void {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    let step = 0;
    if (e.key === forward || e.key === 'ArrowDown') step = 1;
    if (e.key === backward || e.key === 'ArrowUp') step = -1;
    if (step === 0) return;
    e.preventDefault();
    const next = (current + step + ANSWERS.length) % ANSWERS.length;
    onChange?.(ANSWERS[next].value);
    const sibling = e.currentTarget.parentElement?.children[next];
    if (sibling instanceof HTMLElement) sibling.focus();
  }

  return (
    <div className={cx(styles.root, className)}>
      {question && (
        <div className={styles.question}>
          {index != null && <span className={styles.number}>{index}.</span>}
          <span dir="auto">{question}</span>
        </div>
      )}
      <div
        className={styles.group}
        role="radiogroup"
        aria-label={question ?? t.answer.groupLabel}
      >
        {ANSWERS.map((answer, i) => (
          <button
            key={answer.value}
            type="button"
            role="radio"
            data-answer={answer.value}
            aria-checked={value === answer.value}
            tabIndex={answer.value === tabStop ? 0 : -1}
            className={styles.segment}
            disabled={disabled}
            onClick={() => onChange?.(answer.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            <Icon name={answer.icon} size={22} />
            <span>{t.status[answer.value]}</span>
          </button>
        ))}
      </div>
      {error && (
        <div className={styles.error}>
          <Icon name="alert" size={14} />
          <span>{error}</span>
        </div>
      )}
      {value === 'no' && (
        <div className={styles.note}>
          <TextField
            label={t.answer.noteLabel}
            required
            multiline
            rows={2}
            value={note}
            onChange={onNoteChange}
            disabled={disabled}
            placeholder={t.answer.notePlaceholder}
            error={noteError}
            helperText={t.answer.noteRequired}
            counter={noteCounter}
          />
        </div>
      )}
      {showOptionalNote && (
        <TextField
          label={t.answer.optionalNoteLabel}
          multiline
          rows={2}
          value={note}
          onChange={onNoteChange}
          disabled={disabled}
          error={noteError}
          counter={noteCounter}
        />
      )}
      {answered && value !== 'no' && !showOptionalNote && onNoteChange && (
        <Button
          variant="text"
          startIcon="plus"
          disabled={disabled}
          className={styles.addNote}
          onClick={() => setOptionalNoteOpen(true)}
        >
          {t.answer.addNote}
        </Button>
      )}
    </div>
  );
}
