import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { onSyncResult, syncOutbox } from '../../lib/offline/syncOutbox';
import { outboxDb } from '../../lib/offline/outboxDb';
import { useT } from '../useI18n';
import { useSnackbar } from '../useSnackbar';

const SYNC_EVERY_MS = 60_000;

/**
 * Runs the outbox for as long as an inspector is in the app: on start (which also covers
 * every login), on reconnect, and on a timer while anything is waiting. Also reports how
 * each run went, whoever started it.
 */
export function useOutboxSync(inspectorId: string): void {
  const t = useT();
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  useEffect(() => {
    function sync(): void {
      void syncOutbox(inspectorId);
    }

    // Asks the browser not to evict the outbox when storage runs low.
    void navigator.storage?.persist?.();
    sync();
    window.addEventListener('online', sync);
    const timer = setInterval(() => {
      void outboxDb.outbox
        .where({ inspectorId, status: 'pending' })
        .count()
        .then((waiting) => {
          if (waiting > 0) sync();
        });
    }, SYNC_EVERY_MS);

    return () => {
      window.removeEventListener('online', sync);
      clearInterval(timer);
    };
  }, [inspectorId]);

  useEffect(
    () =>
      onSyncResult(({ sent, failed }) => {
        if (sent > 0) {
          snackbar.show({
            message: t.outbox.sentCount(sent),
            variant: 'success',
          });
        }
        if (failed.length > 0) {
          snackbar.show({
            message:
              failed.length === 1
                ? t.outbox.failedOne(failed[0].workOrderNumber)
                : t.outbox.failedCount(failed.length),
            variant: 'error',
            actionLabel: t.outbox.view,
            onAction: () => void navigate('/inspector/outbox'),
          });
        }
      }),
    [t, navigate, snackbar],
  );
}
