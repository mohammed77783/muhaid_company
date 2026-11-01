import { useEffect } from 'react';

/** Closing or reloading the tab warns while there is unsaved work on screen. */
export function useUnsavedWarning(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    function warn(e: BeforeUnloadEvent): void {
      e.preventDefault();
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}
