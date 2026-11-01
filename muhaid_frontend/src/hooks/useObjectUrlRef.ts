import { useCallback, type RefCallback } from 'react';

/**
 * Shows a Blob in an <img>, revoking the object URL when the image goes away. A ref with
 * cleanup, not useMemo plus an effect: StrictMode re-runs effects without re-running the
 * memo, which would leave the image pointing at a revoked URL.
 */
export function useObjectUrlRef(blob: Blob): RefCallback<HTMLImageElement> {
  return useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;
      const url = URL.createObjectURL(blob);
      img.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [blob],
  );
}
