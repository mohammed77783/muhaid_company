import type { JSX } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { inspectionsApi } from '../../../api/admin/inspectionsApi';
import { Button } from '../../../components/Button';
import { InspectionRecord } from '../../../components/InspectionRecord';
import { PageHeader } from '../../../components/PageHeader';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useInspection } from '../../../hooks/admin/useInspections';
import { useT } from '../../../hooks/useI18n';
import styles from './InspectionDetail.module.css';

const LIST_PATH = '/admin/inspections';

function InspectionContent({ id }: { id: string }): JSX.Element {
  const t = useT();
  const { state } = useLocation();
  const inspection = useInspection(id);
  const listSearch =
    (state as { listSearch?: string } | null)?.listSearch ?? '';

  return (
    <div className={styles.root}>
      <PageHeader
        breadcrumbs={[
          { label: t.admin.inspections, to: LIST_PATH + listSearch },
          { label: inspection.workOrderNumber },
        ]}
        title={<span className="code">{inspection.workOrderNumber}</span>}
        actions={
          <Button
            variant="secondary"
            startIcon="printer"
            onClick={() => window.print()}
          >
            {t.inspections.print}
          </Button>
        }
      />
      <InspectionRecord
        inspection={inspection}
        fetchPhoto={inspectionsApi.photo}
        inspector={
          <Link to={`/admin/users/${inspection.inspector.id}`} dir="auto">
            {inspection.inspector.name}
          </Link>
        }
        project={
          <Link to={`/admin/projects/${inspection.project.id}`}>
            <span className="code">{inspection.project.code}</span>
            {' — '}
            <span dir="auto">{inspection.project.name}</span>
          </Link>
        }
        template={
          <Link to={`/admin/templates/${inspection.template.id}`} dir="auto">
            {inspection.template.name}
          </Link>
        }
      />
    </div>
  );
}

/** Read-only: submitted inspections are final for admins too. */
export function InspectionDetail(): JSX.Element {
  const t = useT();
  const { id = '' } = useParams();
  return (
    <RouteErrorBoundary
      backTo={LIST_PATH}
      backLabel={t.admin.backTo.inspections}
      notFoundTitle={t.inspections.notFoundTitle}
      notFoundBody={t.inspections.notFoundBody}
    >
      <InspectionContent key={id} id={id} />
    </RouteErrorBoundary>
  );
}
