import { useSuspenseQuery } from '@tanstack/react-query';

import { templatesApi, templatesKeys } from '../../api/web/templatesApi';
import type { WebTemplate } from '../../types/web/templates';

interface MyTemplate {
  template: WebTemplate;
  /** The refetch said it no longer exists or is no longer assigned to me. */
  removed: boolean;
}

/**
 * One of my templates, usually already seeded by useMyTemplates, so it opens without
 * waiting. It also checks for a newer copy each time: replacing a template's items gives
 * them new ids, and answers built on the old ones would be refused. The server doesn't
 * check validity dates here, so a template that expired after filling still loads.
 */
export function useMyTemplate(id: string): MyTemplate {
  const { data, error } = useSuspenseQuery({
    queryKey: templatesKeys.detail(id),
    queryFn: () => templatesApi.getMine(id),
    refetchOnMount: 'always',
  });
  return { template: data, removed: error?.status === 404 };
}
