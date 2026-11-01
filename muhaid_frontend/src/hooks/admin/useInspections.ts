import { useSuspenseQuery } from '@tanstack/react-query';

import {
  inspectionsApi,
  inspectionsKeys,
} from '../../api/admin/inspectionsApi';
import type { ListInspectionsParams } from '../../types/admin/inspections';
import type {
  InspectionDetail,
  InspectionSummary,
  Paginated,
} from '../../types/api';

export function useInspections(
  params: ListInspectionsParams,
): Paginated<InspectionSummary> {
  const { data } = useSuspenseQuery({
    queryKey: inspectionsKeys.list(params),
    queryFn: () => inspectionsApi.list(params),
  });
  return data;
}

/** Final once submitted, for admins too: one fetch is enough. */
export function useInspection(id: string): InspectionDetail {
  const { data } = useSuspenseQuery({
    queryKey: inspectionsKeys.detail(id),
    queryFn: () => inspectionsApi.get(id),
    staleTime: Infinity,
  });
  return data;
}
