import type { JSX } from 'react';

import { useT } from '../../hooks/useI18n';
import { Card } from '../Card';
import { StatusChip, type SyncStatus } from '../StatusChip';

interface InspectionCardProps {
  title: string;
  workOrder: string;
  /** The project's code. */
  projectCode?: string;
  /** Left out on the inspector's own list. */
  inspector?: string;
  /** ISO and tabular: people compare this down a list. */
  date: string;
  /** e.g. "synced 3 hours later". */
  detail?: string;
  syncStatus?: SyncStatus;
  /** Shows the three answer counts in the footer: Yes, No, N/A, never fewer. */
  counts?: { yes: number; no: number; na: number };
  onClick?: () => void;
  className?: string;
}

/** The phone's version of a table row. */
export function InspectionCard({
  title,
  workOrder,
  projectCode,
  inspector,
  date,
  detail,
  syncStatus,
  counts,
  onClick,
  className,
}: InspectionCardProps): JSX.Element {
  const t = useT();
  return (
    <Card
      title={title}
      meta={[
        <span key="order" className="code">
          {workOrder}
        </span>,
        ...(projectCode
          ? [
              <span key="project" className="code">
                {projectCode}
              </span>,
            ]
          : []),
        ...(inspector
          ? [
              <span key="inspector" dir="auto">
                {inspector}
              </span>,
            ]
          : []),
        <span key="date" className="iso tnum">
          {date}
        </span>,
        ...(detail ? [<span key="detail">{detail}</span>] : []),
      ]}
      trailing={
        syncStatus ? <StatusChip status={syncStatus} size="sm" /> : undefined
      }
      footer={
        counts ? (
          <>
            <StatusChip
              status="yes"
              size="sm"
              label={`${t.status.yes} ${counts.yes}`}
            />
            <StatusChip
              status="no"
              size="sm"
              label={`${t.status.no} ${counts.no}`}
            />
            <StatusChip
              status="na"
              size="sm"
              label={`${t.status.na} ${counts.na}`}
            />
          </>
        ) : undefined
      }
      onClick={onClick}
      className={className}
    />
  );
}
