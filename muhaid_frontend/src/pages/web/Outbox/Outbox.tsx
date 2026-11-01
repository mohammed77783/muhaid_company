import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EmptyState } from '../../../components/EmptyState';
import { OutboxEntry } from '../../../components/OutboxEntry';
import type { SyncStatus } from '../../../components/StatusChip';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useT } from '../../../hooks/useI18n';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { useOutbox } from '../../../hooks/web/useOutbox';
import { formatDateTime } from '../../../lib/dates';
import {
  discardEntry,
  failureKind,
  failureReason,
  resubmitAsNew,
  retryEntry,
} from '../../../lib/offline/outboxActions';
import { syncOutbox } from '../../../lib/offline/syncOutbox';
import type {
  OutboxRecord,
  OutboxStatus,
} from '../../../types/web/inspections';
import type { FillFormLocationState } from '../FillForm/FillForm';
import styles from './Outbox.module.css';

const SYNC_STATUS: Record<OutboxStatus, SyncStatus> = {
  pending: 'pending',
  syncing: 'sending',
  failed: 'failed',
};

interface EntryActionsProps {
  record: OutboxRecord;
  onDiscard: () => void;
}

/** The recovery that can help this failure, one tap away, with Discard as the last resort. */
function EntryActions({ record, onDiscard }: EntryActionsProps): JSX.Element {
  const t = useT();
  const navigate = useNavigate();

  if (record.status === 'syncing') return <></>;

  const discard = (
    <Button variant="text" startIcon="trash" onClick={onDiscard}>
      {t.outbox.discard}
    </Button>
  );
  if (record.status === 'pending' || !record.lastError) return discard;

  const editPath = `/inspector/outbox/${record.id}/edit`;
  const retry = (
    <Button
      variant="secondary"
      startIcon="refresh"
      onClick={() => void retryEntry(record.id, record.inspectorId)}
    >
      {t.common.retry}
    </Button>
  );

  switch (failureKind(record.lastError)) {
    case 'formChanged': {
      const state: FillFormLocationState = { refillEntryId: record.id };
      return (
        <>
          <Button
            variant="secondary"
            onClick={() =>
              void navigate(`/inspector/forms/${record.templateId}/new`, {
                state,
              })
            }
          >
            {t.outbox.refill}
          </Button>
          {discard}
        </>
      );
    }
    case 'photo':
    case 'tooLarge':
      return (
        <>
          <Button
            variant="secondary"
            startIcon="camera"
            onClick={() => void navigate(editPath)}
          >
            {t.outbox.takeNewPhoto}
          </Button>
          {discard}
        </>
      );
    case 'validation':
      return (
        <>
          <Button variant="secondary" onClick={() => void navigate(editPath)}>
            {t.outbox.correct}
          </Button>
          {discard}
        </>
      );
    case 'completed':
      return discard;
    case 'duplicateId':
      return (
        <>
          <Button
            variant="secondary"
            onClick={() => void resubmitAsNew(record)}
          >
            {t.outbox.resubmitAsNew}
          </Button>
          {discard}
        </>
      );
    // An admin can fix these on their side, and then the same entry goes through.
    case 'unassigned':
    case 'outOfDates':
    case 'other':
      return (
        <>
          {retry}
          {discard}
        </>
      );
  }
}

/** What has not gone yet: the only copy of this work until the server confirms it. */
export function Outbox(): JSX.Element {
  const t = useT();
  const user = useCurrentUser();
  const online = useOnlineStatus();
  const records = useOutbox(user.id);
  const [discarding, setDiscarding] = useState<OutboxRecord | null>(null);

  const failedCount = records.filter((r) => r.status === 'failed').length;
  const waitingCount = records.length - failedCount;

  if (records.length === 0) {
    return (
      <EmptyState
        icon="cloudCheck"
        title={t.outbox.emptyTitle}
        body={t.outbox.emptyBody}
      />
    );
  }

  return (
    <div className={styles.root}>
      {failedCount > 0 && (
        <Alert variant="error">{t.outbox.stuck(failedCount)}</Alert>
      )}
      {waitingCount > 0 && (
        <div className={styles.waiting}>
          <span>{t.outbox.waitingCount(waitingCount)}</span>
          <Button
            variant="secondary"
            startIcon="cloudUp"
            disabled={!online}
            onClick={() => void syncOutbox(user.id)}
          >
            {t.outbox.sendNow}
          </Button>
        </div>
      )}
      {records.map((record) => (
        <OutboxEntry
          key={record.id}
          title={record.templateName}
          workOrder={record.workOrderNumber}
          savedAt={formatDateTime(record.filledAt)}
          status={SYNC_STATUS[record.status]}
          reason={
            record.lastError ? failureReason(record.lastError, t) : undefined
          }
          actions={
            record.status === 'syncing' ? undefined : (
              <EntryActions
                record={record}
                onDiscard={() => setDiscarding(record)}
              />
            )
          }
        />
      ))}
      <ConfirmDialog
        title={t.outbox.discardTitle}
        variant="danger"
        sheet
        open={discarding !== null}
        confirmLabel={t.outbox.discardConfirm}
        onConfirm={() => {
          if (discarding) void discardEntry(discarding.id);
          setDiscarding(null);
        }}
        onCancel={() => setDiscarding(null)}
      >
        {discarding && t.outbox.discardBody(discarding.workOrderNumber)}
      </ConfirmDialog>
    </div>
  );
}
