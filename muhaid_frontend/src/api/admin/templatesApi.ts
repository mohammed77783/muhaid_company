import { apiClient } from '../../lib/apiClient';
import type {
  Assignee,
  CreateTemplateBody,
  ListTemplatesParams,
  TemplateDetail,
  TemplateSummary,
  UpdateTemplateBody,
} from '../../types/admin/templates';
import type { Paginated } from '../../types/api';

/** The API takes at most this many ids per request. */
const ASSIGN_CHUNK = 200;

export const templatesApi = {
  create: async (body: CreateTemplateBody): Promise<TemplateDetail> =>
    (await apiClient.post<TemplateDetail>('/admin/templates', body)).data,

  list: async (
    params: ListTemplatesParams,
  ): Promise<Paginated<TemplateSummary>> =>
    (
      await apiClient.get<Paginated<TemplateSummary>>('/admin/templates', {
        params,
      })
    ).data,

  get: async (id: string): Promise<TemplateDetail> =>
    (await apiClient.get<TemplateDetail>(`/admin/templates/${id}`)).data,

  update: async (
    id: string,
    body: UpdateTemplateBody,
  ): Promise<TemplateDetail> =>
    (await apiClient.patch<TemplateDetail>(`/admin/templates/${id}`, body))
      .data,

  /** Returns the full assignee list after the change. */
  assign: async (id: string, userIds: string[]): Promise<Assignee[]> => {
    let assignees: Assignee[] = [];
    for (let i = 0; i < userIds.length; i += ASSIGN_CHUNK) {
      assignees = (
        await apiClient.post<Assignee[]>(`/admin/templates/${id}/assignments`, {
          userIds: userIds.slice(i, i + ASSIGN_CHUNK),
        })
      ).data;
    }
    return assignees;
  },

  unassign: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/admin/templates/${id}/assignments/${userId}`);
  },
};

// Under "admin", so a 403 re-checks the role and the offline cache leaves them out.
export const templatesKeys = {
  all: ['admin', 'templates'] as const,
  lists: ['admin', 'templates', 'list'] as const,
  list: (params: ListTemplatesParams) =>
    ['admin', 'templates', 'list', params] as const,
  forPicker: (projectId: string) =>
    ['admin', 'templates', 'list', 'picker', projectId] as const,
  detail: (id: string) => ['admin', 'templates', 'detail', id] as const,
};
