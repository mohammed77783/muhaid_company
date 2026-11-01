import type {
  ComponentPropsWithRef,
  CSSProperties,
  JSX,
  ReactNode,
  Ref,
} from 'react';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import styles from './QuestionRow.module.css';

interface QuestionRowProps {
  /** 1-based. Renumber on drop, so the numbers never flicker while dragging. */
  index: number;
  /** The question. */
  text?: string;
  /** Replaces the text: the editor puts a field here. */
  children?: ReactNode;
  /** True once an inspection exists against the template: no reorder, no remove. */
  locked?: boolean;
  /** Just the number and the text, for a page that only shows the questions. */
  readOnly?: boolean;
  dragging?: boolean;
  /** Where the drag library attaches its listeners. */
  handleProps?: ComponentPropsWithRef<'button'>;
  onRemove?: () => void;
  removeDisabled?: boolean;
  ref?: Ref<HTMLDivElement>;
  /** The drag library's transform. */
  style?: CSSProperties;
  className?: string;
}

/** Locking is not hiding: the questions stay readable, and an Alert above says why. */
export function QuestionRow({
  index,
  text,
  children,
  locked = false,
  readOnly = false,
  dragging = false,
  handleProps,
  onRemove,
  removeDisabled = false,
  ref,
  style,
  className,
}: QuestionRowProps): JSX.Element {
  const t = useT();
  const editable = !locked && !readOnly;
  return (
    <div
      ref={ref}
      style={style}
      className={cx(
        styles.root,
        dragging && styles.dragging,
        locked && styles.locked,
        className,
      )}
    >
      {editable && (
        <button
          type="button"
          aria-label={t.questionRow.reorder(index)}
          {...handleProps}
          className={styles.handle}
        >
          <Icon name="drag" size={18} />
        </button>
      )}
      <span className={styles.number}>{index}.</span>
      <div className={styles.text} dir="auto">
        {children ?? text}
      </div>
      {locked && (
        <Icon
          name="lock"
          size={18}
          title={t.questionRow.locked}
          className={styles.lock}
        />
      )}
      {editable && onRemove && (
        <IconButton
          icon="trash"
          variant="danger"
          size="sm"
          label={t.questionRow.remove(index)}
          disabled={removeDisabled}
          onClick={onRemove}
        />
      )}
    </div>
  );
}
