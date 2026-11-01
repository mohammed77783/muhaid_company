import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Alert } from '../../../components/Alert';
import { AppBar } from '../../../components/AppBar';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { IconButton } from '../../../components/IconButton';
import { InspectionForm } from '../../../components/InspectionForm';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Skeleton } from '../../../components/Skeleton';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useT } from '../../../hooks/useI18n';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useOutboxEntry } from '../../../hooks/web/useOutbox';
import {
  correctEntry,
  failureKind,
  failureReason,
} from '../../../lib/offline/outboxActions';
import type { DraftInput, OutboxRecord } from '../../../types/web/inspections';
import styles from './EditOutboxEntry.module.css';

const OUTBOX_PATH = '/inspector/outbox';

function EntryForm({ record }: { record: OutboxRecord }): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const snackbar = useSnackbar();

  // A refused photo must be replaced. The old one stays stored until the correction saves.
  const kind = record.lastError ? failureKind(record.lastError) : null;
  const needsNewPhoto = kind === 'photo' || kind === 'tooLarge';

  async function handleSave(draft: DraftInput): Promise<void> {
    try {
      await correctEntry(record, draft);
    } catch {
      snackbar.show({ message: t.fillForm.saveFailed, variant: 'error' });
      return;
    }
    snackbar.show({ message: t.outbox.editSaved, variant: 'success' });
    void navigate(OUTBOX_PATH);
  }

  return (
    <>
      {record.lastError && (
        <Alert variant="error">{failureReason(record.lastError, t)}</Alert>
      )}
      <InspectionForm
        workOrderNumber={record.workOrderNumber}
        items={record.itemsSnapshot}
        submitLabel={t.outbox.editSave}
        initial={{
          answers: Object.fromEntries(
            record.answers.map((a) => [
              a.itemId,
              { answer: a.answer, note: a.note ?? '' },
            ]),
          ),
          photo: needsNewPhoto ? null : { blob: record.photo, name: 'photo' },
        }}
        onSave={handleSave}
      />
    </>
  );
}

/** Corrects a refused entry. Works offline: everything it needs is in the entry itself. */
export function EditOutboxEntry(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { entryId } = useParams();
  const record = useOutboxEntry(user.id, entryId);

  // Leaving only drops the changes on screen: the entry itself stays safe in the outbox.
  function leave(): void {
    void navigate(OUTBOX_PATH);
  }

  return (
    <div className={styles.root}>
      <AppBar
        title={t.outbox.editTitle}
        subtitle={
          record && <span className="code">{record.workOrderNumber}</span>
        }
        start={
          <IconButton
            icon="arrowStart"
            variant="onbrand"
            label={t.common.back}
            onClick={leave}
          />
        }
      />
      <OfflineBanner />
      {record === undefined ? (
        <div className={styles.loading}>
          <Skeleton lines={6} />
        </div>
      ) : record === null ? (
        <EmptyState
          icon="search"
          title={t.outbox.entryGoneTitle}
          body={t.outbox.entryGoneBody}
          action={
            <Button variant="secondary" onClick={leave}>
              {t.outbox.backToOutbox}
            </Button>
          }
        />
      ) : (
        <EntryForm key={record.id} record={record} />
      )}
    </div>
  );
}
