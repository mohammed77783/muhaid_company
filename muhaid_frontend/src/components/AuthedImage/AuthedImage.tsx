import { useSuspenseQuery } from '@tanstack/react-query';
import { useState, type JSX } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useT } from '../../hooks/useI18n';
import { useObjectUrlRef } from '../../hooks/useObjectUrlRef';
import { toApiError } from '../../lib/apiError';
import { PhotoField } from '../PhotoField';
import { PhotoViewerDialog } from '../PhotoViewerDialog';
import { Skeleton } from '../Skeleton';
import { SuspenseLoader } from '../SuspenseLoader';
import styles from './AuthedImage.module.css';

const PHOTO_GC_TIME = 5 * 60_000;

interface AuthedImageProps {
  /** photoUrl from an inspection, e.g. "/web/inspections/<id>/photo". */
  src: string;
  alt: string;
  /** The role's API function: this component never touches apiClient itself. */
  fetchBlob: (src: string) => Promise<Blob>;
  /** File name for the download, without an extension. */
  downloadName: string;
}

function LoadedImage({
  src,
  alt,
  fetchBlob,
  downloadName,
}: AuthedImageProps): JSX.Element {
  const t = useT();
  const [viewerOpen, setViewerOpen] = useState(false);
  const { data: blob } = useSuspenseQuery({
    queryKey: ['photo', src],
    queryFn: () => fetchBlob(src),
    staleTime: Infinity, // the photo never changes
    gcTime: PHOTO_GC_TIME, // photos are large, so they don't stay for the app's lifetime
  });
  const imgRef = useObjectUrlRef(blob);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label={t.photo.open}
        title={t.photo.open}
        onClick={() => setViewerOpen(true)}
      >
        <img ref={imgRef} alt={alt} className={styles.image} />
      </button>
      <PhotoViewerDialog
        blob={blob}
        alt={alt}
        downloadName={downloadName}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

function ImageUnavailable({ error }: { error: unknown }): JSX.Element {
  const t = useT();
  const offline = toApiError(error).isRetryable;
  return (
    <PhotoField
      state="unavailable"
      unavailableText={offline ? t.photo.unreachable : undefined}
    />
  );
}

/**
 * A photo needs the Authorization header, so <img src> cannot fetch it. It has its own
 * Suspense and error boundary: the record stays readable while the image downloads, or
 * if its file is missing from storage.
 */
export function AuthedImage(props: AuthedImageProps): JSX.Element {
  return (
    <ErrorBoundary
      resetKeys={[props.src]}
      fallbackRender={({ error }) => <ImageUnavailable error={error} />}
    >
      <SuspenseLoader fallback={<Skeleton variant="block" height={240} />}>
        <LoadedImage {...props} />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}
