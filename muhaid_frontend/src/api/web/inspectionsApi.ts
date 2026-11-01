import { apiClient } from '../../lib/apiClient';
import type {
  InspectionDetail,
  InspectionSummary,
  Paginated,
} from '../../types/api';
import type {
  ListMyInspectionsParams,
  SubmitResult,
} from '../../types/web/inspections';

export const inspectionsApi = {
  /** Idempotent on the form's id, so resending after a lost connection is safe. */
  submit: async (form: FormData): Promise<SubmitResult> => {
    const res = await apiClient.post<InspectionDetail>(
      '/web/inspections',
      form,
    );
    return { created: res.status === 201, inspection: res.data };
  },

  listMine: async (
    params: ListMyInspectionsParams,
  ): Promise<Paginated<InspectionSummary>> =>
    (
      await apiClient.get<Paginated<InspectionSummary>>('/web/inspections', {
        params,
      })
    ).data,

  getMine: async (id: string): Promise<InspectionDetail> =>
    (await apiClient.get<InspectionDetail>(`/web/inspections/${id}`)).data,

  /** photoUrl comes from InspectionDetail and already starts with "/web/inspections". */
  photo: async (photoUrl: string): Promise<Blob> =>
    (await apiClient.get<Blob>(photoUrl, { responseType: 'blob' })).data,
};

// Under "web", so the offline cache keeps them and a 403 re-checks the role.
export const inspectionsKeys = {
  all: ['web', 'inspections'] as const,
  list: (params: ListMyInspectionsParams) =>
    ['web', 'inspections', 'list', params] as const,
  detail: (id: string) => ['web', 'inspections', 'detail', id] as const,
};
