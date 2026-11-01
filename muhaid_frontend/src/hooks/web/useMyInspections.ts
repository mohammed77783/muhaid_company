import { useSuspenseQuery } from '@tanstack/react-query';

import { inspectionsApi, inspectionsKeys } from '../../api/web/inspectionsApi';
import type {
  InspectionDetail,
  InspectionSummary,
  Paginated,
} from '../../types/api';
import type { ListMyInspectionsParams } from '../../types/web/inspections';

/** Inspections I submitted, newest filledAt first. Outbox entries aren't here until they sync. */
export function useMyInspections(
  params: ListMyInspectionsParams,
): Paginated<InspectionSummary> {
  const { data } = useSuspenseQuery({
    queryKey: inspectionsKeys.list(params),
    queryFn: () => inspectionsApi.listMine(params),
  });
  return data;
}

/** Inspections are final once submitted, so one fetch is enough. */
export function useMyInspection(id: string): InspectionDetail {
  const { data } = useSuspenseQuery({
    queryKey: inspectionsKeys.detail(id),
    queryFn: () => inspectionsApi.getMine(id),
    staleTime: Infinity,
  });
  return data;
}
