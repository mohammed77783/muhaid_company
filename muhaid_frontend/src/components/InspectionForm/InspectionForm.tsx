import { useId, useState, type FormEvent, type JSX } from 'react';

import { useLang, useT } from '../../hooks/useI18n';
import { useObjectUrlRef } from '../../hooks/useObjectUrlRef';
import { formatFileSize } from '../../lib/format';
import {
  compressPhoto,
  MAX_PHOTO_BYTES,
} from '../../lib/offline/compressPhoto';
import {
  hasProblems,
  validateDraft,
  type DraftAnswer,
  type DraftProblems,
} from '../../lib/offline/validateDraft';
import type { AnswerValue, TemplateItem } from '../../types/api';
import type { DraftInput } from '../../types/web/inspections';
import { Alert } from '../Alert';
import { AnswerControl } from '../AnswerControl';
import { Button } from '../Button';
import { PhotoField } from '../PhotoField';
import { ProgressBar } from '../ProgressBar';
import { TextField } from '../TextField';
import styles from './InspectionForm.module.css';

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface FormPhoto {
  blob: Blob;
  name: string;
}

export interface InspectionFormInitial {
  answers: Record<string, { answer: AnswerValue; note: string }>;
  photo: FormPhoto | null;
}

interface InspectionFormProps {
  /** Created when the template was assigned: shown, never typed. */
  workOrderNumber: string;
  /** Questions in position order. */
  items: TemplateItem[];
  /** A saved entry being corrected. Omit for a new form. */
  initial?: InspectionFormInitial;
  submitLabel?: string;
  /** Rejecting keeps the form and its answers on screen. */
  onSave: (draft: DraftInput) => Promise<void>;
  /** Tells the page there is something to lose. */
  onDirtyChange?: (dirty: boolean) => void;
}

function PhotoPreview({
  photo,
  onRemove,
}: {
  photo: FormPhoto;
  onRemove: () => void;
}): JSX.Element {
  const { lang } = useLang();
  const imgRef = useObjectUrlRef(photo.blob);
  return (
    <PhotoField
      state="preview"
      imgRef={imgRef}
      fileName={photo.name}
      fileSize={formatFileSize(photo.blob.size, lang)}
      onRemove={onRemove}
    />
  );
}

/** The form itself, for a new inspection and for correcting a refused one. */
export function InspectionForm({
  workOrderNumber,
  items,
  initial,
  submitLabel,
  onSave,
  onDirtyChange,
}: InspectionFormProps): JSX.Element {
  const t = useT();
  const { lang } = useLang();
  const formId = useId();

  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>(
    initial?.answers ?? {},
  );
  const [photo, setPhoto] = useState<FormPhoto | null>(initial?.photo ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const problems: DraftProblems = validateDraft(
    { answers, photo: photo?.blob ?? null },
    items,
  );
  const answeredCount = items.filter((i) => answers[i.id]?.answer).length;
  const progress =
    items.length > 0 ? Math.round((answeredCount / items.length) * 100) : 0;

  // A refetch can replace the items while the form is open: their ids change, so answers
  // on the old ones no longer count. Says so rather than quietly dropping them.
  const formChanged = Object.keys(answers).some(
    (id) => !items.some((item) => item.id === id),
  );

  function updateAnswer(itemId: string, change: Partial<DraftAnswer>): void {
    onDirtyChange?.(true);
    setAnswers((current) => ({
      ...current,
      [itemId]: {
        answer: current[itemId]?.answer ?? null,
        note: current[itemId]?.note ?? '',
        ...change,
      },
    }));
  }

  async function handlePhoto(file: File): Promise<void> {
    onDirtyChange?.(true);
    setPhotoError(null);
    setPreparingPhoto(true);
    try {
      const blob = await compressPhoto(file);
      if (!ACCEPTED_PHOTO_TYPES.includes(blob.type)) {
        setPhotoError(t.fillForm.photoType);
      } else if (blob.size > MAX_PHOTO_BYTES) {
        setPhotoError(
          t.fillForm.photoTooLarge(formatFileSize(blob.size, lang)),
        );
      } else {
        setPhoto({ blob, name: file.name });
      }
    } finally {
      setPreparingPhoto(false);
    }
  }

  function scrollToFirstProblem(): void {
    const firstItem = items.find((item) => problems.items[item.id]);
    const target = firstItem ? `${formId}-${firstItem.id}` : `${formId}-photo`;
    document.getElementById(target)?.scrollIntoView({ block: 'center' });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (saving || preparingPhoto) return;
    setAttempted(true);
    if (hasProblems(problems) || !photo) {
      scrollToFirstProblem();
      return;
    }
    const answersByItem: DraftInput['answersByItem'] = {};
    for (const item of items) {
      const entry = answers[item.id];
      if (entry?.answer) {
        answersByItem[item.id] = { answer: entry.answer, note: entry.note };
      }
    }
    setSaving(true);
    try {
      await onSave({
        answersByItem,
        photo: photo.blob,
      });
    } finally {
      setSaving(false);
    }
  }

  const missingPhoto = attempted && problems.photo === 'required';
  const failed = attempted && hasProblems(problems);

  return (
    <form
      className={styles.root}
      noValidate
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div className={styles.progress}>
        <div className={styles.progressRow}>
          <span>{t.fillForm.answered}</span>
          <span className="iso">
            {answeredCount} / {items.length}
          </span>
        </div>
        <ProgressBar value={progress} label={t.fillForm.progress} />
      </div>

      <div className={styles.body}>
        {formChanged && (
          <Alert variant="warning">{t.fillForm.formChanged}</Alert>
        )}

        <TextField
          id={`${formId}-work-order`}
          label={t.fillForm.workOrder}
          code
          readOnly
          value={workOrderNumber}
        />

        <div className={styles.divider} />

        {items.map((item) => {
          const entry = answers[item.id];
          const problem = attempted ? problems.items[item.id] : undefined;
          return (
            <div key={item.id} id={`${formId}-${item.id}`}>
              <AnswerControl
                question={item.label}
                index={item.position}
                value={entry?.answer ?? null}
                onChange={(answer) => updateAnswer(item.id, { answer })}
                error={problem === 'unanswered' ? t.fillForm.unanswered : null}
                note={entry?.note ?? ''}
                noteError={
                  problem === 'noteRequired'
                    ? t.fillForm.noteRequired
                    : problem === 'noteTooLong'
                      ? t.fillForm.noteTooLong
                      : null
                }
                noteCounter={`${entry?.note.length ?? 0} / 1000`}
                onNoteChange={(e) =>
                  updateAnswer(item.id, { note: e.target.value })
                }
              />
            </div>
          );
        })}

        <div id={`${formId}-photo`}>
          <div className={styles.photoLabel}>{t.fillForm.photoLabel}</div>
          {photo ? (
            <PhotoPreview
              photo={photo}
              onRemove={() => {
                onDirtyChange?.(true);
                setPhoto(null);
              }}
            />
          ) : (
            <PhotoField
              state={photoError || missingPhoto ? 'error' : 'empty'}
              errorTitle={
                photoError ? undefined : t.fillForm.photoRequiredTitle
              }
              errorText={photoError ?? t.photo.helper}
              helperText={
                preparingPhoto ? t.fillForm.preparingPhoto : undefined
              }
              disabled={preparingPhoto}
              onSelect={(file) => void handlePhoto(file)}
            />
          )}
        </div>
      </div>

      <div className={styles.saveBar}>
        {failed && <Alert variant="error">{t.fillForm.fixErrors}</Alert>}
        <Button
          type="submit"
          fullWidth
          startIcon="check"
          loading={saving}
          disabled={preparingPhoto}
        >
          {submitLabel ?? t.fillForm.save}
        </Button>
        <span className={styles.saveHint}>{t.fillForm.saveHint}</span>
      </div>
    </form>
  );
}
