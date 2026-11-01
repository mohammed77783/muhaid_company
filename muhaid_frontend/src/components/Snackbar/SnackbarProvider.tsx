import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { Snackbar } from './Snackbar';
import {
  SnackbarContext,
  type SnackbarContextValue,
  type SnackbarOptions,
} from './SnackbarContext';
import styles from './SnackbarProvider.module.css';

const AUTO_DISMISS_MS = 5_000;

interface QueuedSnackbar extends SnackbarOptions {
  id: number;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({
  children,
}: SnackbarProviderProps): JSX.Element {
  const [queue, setQueue] = useState<QueuedSnackbar[]>([]);
  const nextId = useRef(0);

  const current = queue.at(0);
  const currentId = current?.id;
  const currentVariant = current?.variant;

  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const show = useCallback((options: SnackbarOptions) => {
    const id = nextId.current++;
    setQueue((q) =>
      q.some((s) => s.message === options.message)
        ? q
        : [...q, { ...options, id }],
    );
  }, []);

  // An error is never dismissed by a timer: it waits for the person.
  useEffect(() => {
    if (currentId === undefined || currentVariant === 'error') return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [currentId, currentVariant, dismiss]);

  const value = useMemo<SnackbarContextValue>(() => ({ show }), [show]);

  return (
    <SnackbarContext value={value}>
      {children}
      {/* Beside #root, which an open dialog makes inert: a failed sync must stay visible
          and actionable while someone is in the middle of something else. */}
      {current &&
        createPortal(
          <div className={styles.region}>
            <Snackbar
              message={current.message}
              variant={current.variant}
              actionLabel={current.actionLabel}
              onAction={() => {
                current.onAction?.();
                dismiss();
              }}
              onDismiss={current.variant === 'error' ? dismiss : undefined}
            />
          </div>,
          document.body,
        )}
    </SnackbarContext>
  );
}
