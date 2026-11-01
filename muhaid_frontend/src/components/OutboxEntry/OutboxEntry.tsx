import type { JSX, ReactNode } from 'react';

import { useT } from '../../hooks/useI18n';
import { Card } from '../Card';
import { ProgressBar } from '../ProgressBar';
import { StatusChip, type SyncStatus } from '../StatusChip';
import styles from './OutboxEntry.module.css';

interface OutboxEntryProps {
  title: string;
  workOrder: string;
  savedAt: string;
  status: SyncStatus;
  /** 0–100 while sending. Omit for an indeterminate bar. */
  progress?: number;
  /** Why it failed, as something a person can act on rather than a status code. */
  reason?: string;
  /** The recovery: never more than one tap away from a failure. */
  actions?: ReactNode;
  className?: string;
}

/** The only place in the product where a failure is allowed to look like one. */
export function OutboxEntry({
  title,
  workOrder,
  savedAt,
  status,
  progress,
  reason,
  actions,
  className,
}: OutboxEntryProps): JSX.Element {
  const t = useT();
  const failed = status === 'failed';
  return (
    <Card
      title={title}
      meta={[
        <span key="order" className="code">
          {workOrder}
        </span>,
        <span key="saved" className="iso tnum">
          {savedAt}
        </span>,
      ]}
      trailing={<StatusChip status={status} size="sm" />}
      failed={failed}
      footer={
        (failed && reason) || actions ? (
          <>
            {failed && reason && (
              <span className={styles.reason}>{reason}</span>
            )}
            {actions}
          </>
        ) : undefined
      }
      className={className}
    >
      {status === 'sending' && (
        <span className={styles.progress}>
          <ProgressBar
            value={progress}
            indeterminate={progress === undefined}
            label={t.outboxEntry.uploading}
          />
        </span>
      )}
    </Card>
  );
}
