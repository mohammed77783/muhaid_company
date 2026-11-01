import { apiClient } from '../../lib/apiClient';
import type { WebTemplate } from '../../types/web/templates';

export const templatesApi = {
  listMine: async (): Promise<WebTemplate[]> =>
    (await apiClient.get<WebTemplate[]>('/web/templates')).data,

  getMine: async (id: string): Promise<WebTemplate> =>
    (await apiClient.get<WebTemplate>(`/web/templates/${id}`)).data,
};

// Under "web", so the offline cache keeps them and a 403 re-checks the role.
export const templatesKeys = {
  all: ['web', 'templates'] as const,
  list: () => ['web', 'templates', 'list'] as const,
  detail: (id: string) => ['web', 'templates', 'detail', id] as const,
};
