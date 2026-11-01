import { useRef, type ChangeEvent, type JSX, type Ref } from 'react';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import styles from './PhotoField.module.css';

const ACCEPT = 'image/jpeg,image/png,image/webp';

interface PhotoFieldProps {
  /** empty = capture prompt; preview = the taken photo; error = it cannot be used;
   *  unavailable = a record whose photo cannot be shown (review pages). */
  state?: 'empty' | 'preview' | 'error' | 'unavailable';
  src?: string;
  /** Sets the preview's source itself, e.g. useObjectUrlRef for a local Blob. */
  imgRef?: Ref<HTMLImageElement>;
  alt?: string;
  fileName?: string;
  fileSize?: string;
  helperText?: string;
  errorTitle?: string;
  /** Says the numbers: a limit without the actual size is a dead end. */
  errorText?: string;
  /** Replaces the default sentence in the unavailable state. */
  unavailableText?: string;
  /** Receives the file the inspector took or picked. */
  onSelect?: (file: File) => void;
  /** Offers a remove button on the preview. */
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PhotoField({
  state = 'empty',
  src,
  imgRef,
  alt,
  fileName,
  fileSize,
  helperText,
  errorTitle,
  errorText,
  unavailableText,
  onSelect,
  onRemove,
  disabled = false,
  className,
}: PhotoFieldProps): JSX.Element {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    // Cleared so that choosing the same file again still fires a change.
    e.target.value = '';
    if (file) onSelect?.(file);
  }

  if (state === 'unavailable') {
    return (
      <div className={cx(styles.root, className)}>
        <div className={styles.missing}>
          <Icon name="imageOff" size={24} />
          <span>{unavailableText ?? t.photo.unavailable}</span>
        </div>
      </div>
    );
  }

  if (state === 'preview') {
    return (
      <div className={cx(styles.root, className)}>
        <div className={styles.preview}>
          <img ref={imgRef} src={src} alt={alt ?? t.photo.alt} />
          <div className={styles.bar}>
            <Icon name="camera" size={16} className={styles.barIcon} />
            <span className={styles.name} dir="auto">
              {fileName}
            </span>
            <span className={styles.size}>{fileSize}</span>
            {onRemove && (
              <IconButton
                icon="trash"
                variant="danger"
                label={t.photo.remove}
                disabled={disabled}
                onClick={onRemove}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const failed = state === 'error';
  return (
    <div className={cx(styles.root, failed && styles.error, className)}>
      <button
        type="button"
        className={styles.drop}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Icon name={failed ? 'alert' : 'camera'} size={26} />
        <span className={styles.dropTitle}>
          {failed ? (errorTitle ?? t.photo.errorTitle) : t.photo.take}
        </span>
        <span className={styles.dropHelp}>
          {failed
            ? (errorText ?? t.photo.errorBody)
            : (helperText ?? t.photo.helper)}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        hidden
        onChange={handleChange}
      />
    </div>
  );
}
