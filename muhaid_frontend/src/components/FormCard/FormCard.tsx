import type { JSX } from 'react';

import { useT } from '../../hooks/useI18n';
import { Card } from '../Card';
import { StatusChip, type TemplateStatus } from '../StatusChip';

interface FormCardProps {
  title: string;
  projectCode: string;
  workOrderNumber?: string;
  questionCount: number;
  status?: TemplateStatus;
  onClick?: () => void;
  className?: string;
}

/** Everything assignable is active, so only a state that isn't gets a chip. */
export function FormCard({
  title,
  projectCode,
  workOrderNumber,
  questionCount,
  status,
  onClick,
  className,
}: FormCardProps): JSX.Element {
  const t = useT();
  return (
    <Card
      title={title}
      meta={[
        <span key="code" className="code">
          {projectCode}
        </span>,
        ...(workOrderNumber
          ? [
              <span key="wo" className="code">
                {workOrderNumber}
              </span>,
            ]
          : []),
        <span key="count">{t.counts.questions(questionCount)}</span>,
        ...(status && status !== 'active'
          ? [<StatusChip key="status" status={status} size="sm" />]
          : []),
      ]}
      onClick={onClick}
      className={className}
    />
  );
}
