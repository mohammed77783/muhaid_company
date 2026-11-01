import { apiClient } from '../../lib/apiClient';
import type {
  ListProjectsParams,
  Project,
  ProjectBody,
  ProjectDetail,
} from '../../types/admin/projects';
import type { Paginated } from '../../types/api';

export const projectsApi = {
  create: async (body: ProjectBody): Promise<Project> =>
    (await apiClient.post<Project>('/admin/projects', body)).data,

  list: async (params: ListProjectsParams): Promise<Paginated<Project>> =>
    (await apiClient.get<Paginated<Project>>('/admin/projects', { params }))
      .data,

  get: async (id: string): Promise<ProjectDetail> =>
    (await apiClient.get<ProjectDetail>(`/admin/projects/${id}`)).data,

  update: async (id: string, body: Partial<ProjectBody>): Promise<Project> =>
    (await apiClient.patch<Project>(`/admin/projects/${id}`, body)).data,
};

// Under "admin", so a 403 re-checks the role and the offline cache leaves them out.
export const projectsKeys = {
  all: ['admin', 'projects'] as const,
  lists: ['admin', 'projects', 'list'] as const,
  list: (params: ListProjectsParams) =>
    ['admin', 'projects', 'list', params] as const,
  allForPicker: ['admin', 'projects', 'list', 'picker'] as const,
  detail: (id: string) => ['admin', 'projects', 'detail', id] as const,
};
