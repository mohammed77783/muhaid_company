import { apiClient } from '../../lib/apiClient';
import type { ListInspectionsParams } from '../../types/admin/inspections';
import type {
  InspectionDetail,
  InspectionSummary,
  Paginated,
} from '../../types/api';

export const inspectionsApi = {
  list: async (
    params: ListInspectionsParams,
  ): Promise<Paginated<InspectionSummary>> =>
    (
      await apiClient.get<Paginated<InspectionSummary>>('/admin/inspections', {
        params,
      })
    ).data,

  get: async (id: string): Promise<InspectionDetail> =>
    (await apiClient.get<InspectionDetail>(`/admin/inspections/${id}`)).data,

  /** photoUrl comes from the detail, already "/admin/inspections/<id>/photo". */
  photo: async (photoUrl: string): Promise<Blob> =>
    (await apiClient.get<Blob>(photoUrl, { responseType: 'blob' })).data,
};

// Under "admin", so a 403 re-checks the role and the offline cache leaves them out.
export const inspectionsKeys = {
  all: ['admin', 'inspections'] as const,
  list: (params: ListInspectionsParams) =>
    ['admin', 'inspections', 'list', params] as const,
  detail: (id: string) => ['admin', 'inspections', 'detail', id] as const,
};
