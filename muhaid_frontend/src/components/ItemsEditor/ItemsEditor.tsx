import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useState,
  type ClipboardEvent,
  type ComponentPropsWithRef,
  type JSX,
} from 'react';

import { useT } from '../../hooks/useI18n';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { QuestionRow } from '../QuestionRow';
import { TextField } from '../TextField';
import styles from './ItemsEditor.module.css';
import { MAX_ITEMS, newRow, type ItemRow } from './itemRow';

interface SortableRowProps {
  row: ItemRow;
  index: number;
  error?: string;
  canRemove: boolean;
  onChange: (text: string) => void;
  onRemove: () => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function SortableRow({
  row,
  index,
  error,
  canRemove,
  onChange,
  onRemove,
  onPaste,
}: SortableRowProps): JSX.Element {
  const t = useT();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.key });
  return (
    <QuestionRow
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      index={index}
      dragging={isDragging}
      handleProps={
        {
          ref: setActivatorNodeRef,
          ...attributes,
          ...listeners,
        } as ComponentPropsWithRef<'button'>
      }
      onRemove={onRemove}
      removeDisabled={!canRemove}
    >
      <TextField
        ariaLabel={t.templates.questionLabel(index)}
        multiline
        rows={2}
        value={row.text}
        error={error}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
      />
    </QuestionRow>
  );
}

interface ItemsEditorProps {
  rows: ItemRow[];
  onChange: (rows: ItemRow[]) => void;
  /** By row key. The server reports bad questions without a row number. */
  errors?: Record<string, string>;
}

/** Array order is the display order: what the admin sees is what inspectors get. */
export function ItemsEditor({
  rows,
  onChange,
  errors = {},
}: ItemsEditorProps): JSX.Element {
  const t = useT();
  const [truncated, setTruncated] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent): void {
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((row) => row.key === active.id);
    const to = rows.findIndex((row) => row.key === over.id);
    onChange(arrayMove(rows, from, to));
  }

  /** Admins often copy checklists from Word or Excel: each line becomes a question. */
  function handlePaste(
    e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
  ): void {
    const lines = e.clipboardData
      .getData('text')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return; // a single line pastes as usual
    e.preventDefault();

    const current = rows[index];
    const keepCurrent = current.text.trim() !== '';
    const room = MAX_ITEMS - rows.length + (keepCurrent ? 0 : 1);
    const accepted = lines.slice(0, room);
    setTruncated(lines.length - accepted.length);
    const added = accepted.map((line, i) =>
      i === 0 && !keepCurrent ? { ...current, text: line } : newRow(line),
    );
    onChange([
      ...rows.slice(0, index),
      ...(keepCurrent ? [current] : []),
      ...added,
      ...rows.slice(index + 1),
    ]);
  }

  return (
    <div className={styles.root}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rows.map((row) => row.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className={styles.list}>
            {rows.map((row, i) => (
              <SortableRow
                key={row.key}
                row={row}
                index={i + 1}
                error={errors[row.key]}
                canRemove={rows.length > 1}
                onChange={(text) =>
                  onChange(
                    rows.map((r) => (r.key === row.key ? { ...r, text } : r)),
                  )
                }
                onRemove={() => onChange(rows.filter((r) => r.key !== row.key))}
                onPaste={(e) => handlePaste(e, i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {truncated > 0 && (
        <Alert variant="warning">{t.templates.pasteTruncated(truncated)}</Alert>
      )}

      <div className={styles.footer}>
        <Button
          variant="secondary"
          startIcon="plus"
          disabled={rows.length >= MAX_ITEMS}
          onClick={() => onChange([...rows, newRow()])}
        >
          {t.templates.addQuestion}
        </Button>
        <span className={styles.hint}>{t.templates.pasteHint}</span>
        <span className={styles.counter}>
          {rows.length} / {MAX_ITEMS}
        </span>
      </div>
    </div>
  );
}
