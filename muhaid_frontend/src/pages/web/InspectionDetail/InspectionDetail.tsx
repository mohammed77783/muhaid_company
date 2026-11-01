import type { JSX } from 'react';
import { useParams } from 'react-router-dom';

import { inspectionsApi } from '../../../api/web/inspectionsApi';
import { InspectionRecord } from '../../../components/InspectionRecord';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useT } from '../../../hooks/useI18n';
import { useMyInspection } from '../../../hooks/web/useMyInspections';

function Record({ id }: { id: string }): JSX.Element {
  const inspection = useMyInspection(id);
  return (
    <InspectionRecord
      inspection={inspection}
      fetchPhoto={inspectionsApi.photo}
    />
  );
}

/** Someone else's id answers 404 too, so ids belonging to others are never confirmed. */
export function InspectionDetail(): JSX.Element {
  const t = useT();
  const { id = '' } = useParams();
  return (
    <RouteErrorBoundary
      backTo="/inspector/sent"
      backLabel={t.sent.backToList}
      notFoundTitle={t.sent.notFoundTitle}
      notFoundBody={t.sent.notFoundBody}
      networkBody={t.sent.downloadFirst}
    >
      <Record id={id} />
    </RouteErrorBoundary>
  );
}
