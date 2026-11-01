import { useState, type JSX, type ReactNode } from 'react';

import { useLang, useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { formatDateTime, formatDuration } from '../../lib/dates';
import type { InspectionDetail } from '../../types/api';
import { AuthedImage } from '../AuthedImage';
import { Fact, Facts } from '../Facts';
import { StatusChip } from '../StatusChip';
import { Switch } from '../Switch';
import styles from './InspectionRecord.module.css';

interface InspectionRecordProps {
  inspection: InspectionDetail;
  /** The role's API function for this inspection's photo. */
  fetchPhoto: (photoUrl: string) => Promise<Blob>;
  /** Left out on the inspector's own record. Pass a link for the dashboard. */
  inspector?: ReactNode;
  /** Replace the plain names with links, on the dashboard. */
  project?: ReactNode;
  template?: ReactNode;
}

/**
 * The read-only record, for both roles. An inspection is final: the way to correct one is
 * a new inspection. Opens with the counts, because the first question is how many findings.
 * Labels are the questions as they were at submission, not the template's current wording.
 */
export function InspectionRecord({
  inspection,
  fetchPhoto,
  inspector,
  project,
  template,
}: InspectionRecordProps): JSX.Element {
  const t = useT();
  const { lang } = useLang();
  const [onlyFindings, setOnlyFindings] = useState(false);

  const answers = [...inspection.answers].sort(
    (a, b) => a.position - b.position,
  );
  const count = (value: 'yes' | 'no' | 'na'): number =>
    answers.filter((a) => a.answer === value).length;
  const findings = count('no');
  const visible = onlyFindings
    ? answers.filter((a) => a.answer === 'no')
    : answers;
  const delay =
    new Date(inspection.receivedAt).getTime() -
    new Date(inspection.filledAt).getTime();

  return (
    <article className={styles.root}>
      <div className={styles.summary}>
        {(['yes', 'no', 'na'] as const).map((value) => (
          <StatusChip
            key={value}
            status={value}
            label={t.record.summaryCount(t.status[value], count(value))}
          />
        ))}
      </div>

      <Facts>
        <Fact label={t.record.workOrder} code>
          {inspection.workOrderNumber}
        </Fact>
        <Fact label={t.record.template}>
          {template ?? inspection.template.name}
        </Fact>
        <Fact label={t.record.project}>
          {project ?? (
            <>
              <span className="code">{inspection.project.code}</span>
              {' — '}
              <span dir="auto">{inspection.project.name}</span>
            </>
          )}
        </Fact>
        {inspector && <Fact label={t.record.inspector}>{inspector}</Fact>}
        <Fact label={t.record.filledAt}>
          <span className="iso tnum">
            {formatDateTime(inspection.filledAt)}
          </span>
        </Fact>
        <Fact label={t.record.receivedAt}>
          <span className="iso tnum">
            {formatDateTime(inspection.receivedAt)}
          </span>
        </Fact>
        <Fact label={t.record.syncDelay}>{formatDuration(delay, lang)}</Fact>
      </Facts>

      <section>
        <h2 className={styles.heading}>{t.record.photo}</h2>
        <AuthedImage
          src={inspection.photoUrl}
          alt={inspection.workOrderNumber}
          fetchBlob={fetchPhoto}
          downloadName={inspection.workOrderNumber}
        />
      </section>

      <section>
        <div className={styles.answersHead}>
          <h2 className={styles.heading}>{t.record.answers}</h2>
          {findings > 0 && (
            <Switch
              className="no-print"
              label={t.record.onlyFindings}
              checked={onlyFindings}
              onChange={() => setOnlyFindings((on) => !on)}
            />
          )}
        </div>
        {findings === 0 && (
          <p className={styles.noFindings}>{t.record.noFindings}</p>
        )}
        <ol className={styles.answers}>
          {visible.map((answer) => (
            <li
              key={answer.itemId}
              className={cx(
                styles.answer,
                answer.answer === 'no' && styles.finding,
              )}
            >
              <div className={styles.answerRow}>
                <span className={styles.number}>{answer.position}.</span>
                <span className={styles.label} dir="auto">
                  {answer.label}
                </span>
                <StatusChip status={answer.answer} size="sm" />
              </div>
              {answer.note && (
                <p className={styles.note}>
                  <span className={styles.noteLabel}>{t.record.note}</span>
                  <span dir="auto">{answer.note}</span>
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
