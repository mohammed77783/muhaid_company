import type { JSX } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Alert } from '../../../components/Alert';
import { AssigneesPanel } from '../../../components/AssigneesPanel';
import { Button } from '../../../components/Button';
import { Fact, Facts } from '../../../components/Facts';
import { Icon } from '../../../components/Icon';
import { PageHeader } from '../../../components/PageHeader';
import { QuestionRow } from '../../../components/QuestionRow';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { StatusChip } from '../../../components/StatusChip';
import { useTemplate } from '../../../hooks/admin/useTemplates';
import { useT } from '../../../hooks/useI18n';
import { templateStatus } from '../../../lib/dates';
import type { NewTemplateLocationState } from '../TemplateEditor/TemplateEditor';
import styles from './TemplateDetail.module.css';

const LIST_PATH = '/admin/templates';

interface DetailLocationState {
  listSearch?: string;
  /** Just created: a new template does nothing until inspectors are assigned. */
  justCreated?: boolean;
}

function TemplateContent({ id }: { id: string }): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const { state } = useLocation();
  const template = useTemplate(id);
  const { listSearch = '', justCreated = false } = (state ??
    {}) as DetailLocationState;
  const locked = template.inspectionCount > 0;

  function openNew(replace: boolean): void {
    const next: NewTemplateLocationState = { sourceId: template.id, replace };
    void navigate(`${LIST_PATH}/new`, { state: next });
  }

  return (
    <div className={styles.root}>
      <PageHeader
        breadcrumbs={[
          { label: t.admin.templates, to: LIST_PATH + listSearch },
          { label: template.name },
        ]}
        title={template.name}
        actions={
          <>
            <Button variant="secondary" onClick={() => openNew(false)}>
              {t.templates.duplicate}
            </Button>
            {locked && (
              <Button variant="secondary" onClick={() => openNew(true)}>
                {t.templates.replace}
              </Button>
            )}
            <Button onClick={() => void navigate(`${LIST_PATH}/${id}/edit`)}>
              {t.common.edit}
            </Button>
          </>
        }
      />

      {justCreated && template.assignees.length === 0 && (
        <Alert variant="info">{t.templates.nextAssign}</Alert>
      )}

      <div className={styles.columns}>
        <div className={styles.form}>
          <Facts>
            <Fact label={t.templates.project}>
              <Link to={`/admin/projects/${template.project.id}`}>
                <span className="code">{template.project.code}</span>
                {' — '}
                <span dir="auto">{template.project.name}</span>
              </Link>
            </Fact>
            <Fact label={t.templates.validFrom} code>
              {template.validFrom}
            </Fact>
            <Fact label={t.templates.validTo}>
              {template.validTo ? (
                <span className="code">{template.validTo}</span>
              ) : (
                t.templates.noEndDate
              )}
            </Fact>
            <Fact label={t.templates.status}>
              <StatusChip
                status={templateStatus(template.validFrom, template.validTo)}
              />
            </Fact>
          </Facts>

          <section className={styles.questions}>
            <h2 className={styles.heading}>
              {t.templates.questions}
              {locked && (
                <Icon name="lock" size={18} title={t.templates.lockedNote} />
              )}
            </h2>
            {locked && <p className={styles.note}>{t.templates.lockedNote}</p>}
            {template.items.map((item) => (
              <QuestionRow
                key={item.id}
                index={item.position}
                text={item.label}
                readOnly={!locked}
                locked={locked}
              />
            ))}
          </section>

          <div className={styles.usage}>
            <span>
              {t.templates.inspectionsCount(template.inspectionCount)}
            </span>
            {template.inspectionCount > 0 && (
              <Link to={`/admin/inspections?templateId=${template.id}`}>
                {t.templates.viewInspections}
              </Link>
            )}
          </div>
        </div>

        <AssigneesPanel template={template} />
      </div>
    </div>
  );
}

export function TemplateDetail(): JSX.Element {
  const t = useT();
  const { id = '' } = useParams();
  return (
    <RouteErrorBoundary
      backTo={LIST_PATH}
      backLabel={t.admin.backTo.templates}
      notFoundTitle={t.templates.notFoundTitle}
      notFoundBody={t.templates.notFoundBody}
    >
      <TemplateContent key={id} id={id} />
    </RouteErrorBoundary>
  );
}
