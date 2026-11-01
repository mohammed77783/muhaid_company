import type { JSX } from 'react';

import { useT } from '../../hooks/useI18n';
import { useObjectUrlRef } from '../../hooks/useObjectUrlRef';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import styles from './PhotoViewerDialog.module.css';

interface PhotoViewerDialogProps {
  blob: Blob;
  alt: string;
  /** File name for the download, without an extension. */
  downloadName: string;
  open: boolean;
  onClose: () => void;
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Downloads from the blob already in memory, so it costs no second request. */
function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.${EXTENSIONS[blob.type] ?? 'jpg'}`;
  link.click();
  URL.revokeObjectURL(url);
}

function ViewerImage({ blob, alt }: { blob: Blob; alt: string }): JSX.Element {
  const imgRef = useObjectUrlRef(blob);
  return <img ref={imgRef} alt={alt} className={styles.image} />;
}

export function PhotoViewerDialog({
  blob,
  alt,
  downloadName,
  open,
  onClose,
}: PhotoViewerDialogProps): JSX.Element {
  const t = useT();
  return (
    <Dialog
      title={t.photo.viewerTitle}
      open={open}
      onClose={onClose}
      className={styles.viewer}
      actions={
        <Button
          variant="secondary"
          onClick={() => downloadBlob(blob, downloadName)}
        >
          {t.photo.download}
        </Button>
      }
    >
      <ViewerImage blob={blob} alt={alt} />
    </Dialog>
  );
}
