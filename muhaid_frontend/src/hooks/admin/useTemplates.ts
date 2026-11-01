import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { projectsKeys } from '../../api/admin/projectsApi';
import { templatesApi, templatesKeys } from '../../api/admin/templatesApi';
import { usersKeys } from '../../api/admin/usersApi';
import { toApiError, type ApiError } from '../../lib/apiError';
import { previousDay } from '../../lib/dates';
import type {
  Assignee,
  CreateTemplateBody,
  ListTemplatesParams,
  TemplateDetail,
  TemplateSummary,
  UpdateTemplateBody,
} from '../../types/admin/templates';
import type { Paginated } from '../../types/api';

export function useTemplates(
  params: ListTemplatesParams,
): Paginated<TemplateSummary> {
  const { data } = useSuspenseQuery({
    queryKey: templatesKeys.list(params),
    queryFn: () => templatesApi.list(params),
  });
  return data;
}

/** Every template of a project, or of all projects, for a picker. */
export function useAllTemplates(projectId: string): TemplateSummary[] {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery({
      queryKey: templatesKeys.forPicker(projectId),
      queryFn: ({ pageParam }) =>
        templatesApi.list({
          page: pageParam,
          limit: 50,
          ...(projectId ? { projectId } : {}),
        }),
      initialPageParam: 1,
      getNextPageParam: (last) =>
        last.page * last.limit < last.total ? last.page + 1 : undefined,
    });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage)
      void fetchNextPage({ cancelRefetch: false });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return useMemo(() => data.pages.flatMap((page) => page.items), [data]);
}

export function useTemplate(id: string): TemplateDetail {
  const { data } = useSuspenseQuery({
    queryKey: templatesKeys.detail(id),
    queryFn: () => templatesApi.get(id),
  });
  return data;
}

export function useCreateTemplate(): UseMutationResult<
  TemplateDetail,
  ApiError,
  CreateTemplateBody
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: templatesApi.create,
    onSuccess: (template) => {
      queryClient.setQueryData(templatesKeys.detail(template.id), template);
      void queryClient.invalidateQueries({ queryKey: templatesKeys.lists });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(template.project.id),
      });
    },
  });
}

export function useUpdateTemplate(
  id: string,
): UseMutationResult<TemplateDetail, ApiError, UpdateTemplateBody> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => templatesApi.update(id, body),
    onSuccess: (template) => {
      queryClient.setQueryData(templatesKeys.detail(id), template);
      void queryClient.invalidateQueries({ queryKey: templatesKeys.lists });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(template.project.id),
      });
    },
    // An inspection arrived while editing: reload, so the questions lock.
    onError: (error) => {
      if (error.status === 409) {
        void queryClient.invalidateQueries({
          queryKey: templatesKeys.detail(id),
        });
      }
    },
  });
}

export function useAssignInspectors(
  templateId: string,
): UseMutationResult<Assignee[], ApiError, string[]> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIds) => templatesApi.assign(templateId, userIds),
    onSuccess: (assignees, userIds) => {
      // The response is the complete list: write it straight into the detail.
      queryClient.setQueryData<TemplateDetail>(
        templatesKeys.detail(templateId),
        (old) => (old ? { ...old, assignees } : old),
      );
      for (const userId of userIds) {
        void queryClient.invalidateQueries({
          queryKey: usersKeys.detail(userId),
        });
      }
    },
  });
}

interface UnassignContext {
  previous: TemplateDetail | undefined;
}

export function useUnassignInspector(
  templateId: string,
): UseMutationResult<void, ApiError, string, UnassignContext> {
  const queryClient = useQueryClient();
  const key = templatesKeys.detail(templateId);
  return useMutation({
    mutationFn: (userId) => templatesApi.unassign(templateId, userId),
    // Optimistic: the row goes at once and comes back on failure.
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TemplateDetail>(key);
      queryClient.setQueryData<TemplateDetail>(key, (old) =>
        old
          ? {
              ...old,
              assignees: old.assignees.filter((a) => a.id !== userId),
            }
          : old,
      );
      return { previous };
    },
    onError: (error, _userId, context) => {
      // 404: someone else already removed it, which is the outcome that was wanted.
      if (error.status !== 404 && context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: (_data, _error, userId) => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({
        queryKey: usersKeys.detail(userId),
      });
    },
  });
}

export type ReplaceStep = 'create' | 'assign' | 'endOld';
export type StepState = 'waiting' | 'done' | 'failed';

interface ReplaceTemplate {
  steps: Record<ReplaceStep, StepState>;
  error: ApiError | null;
  isRunning: boolean;
  /** Starts, or carries on from the step that failed. Resolves with the new template. */
  run: (body: CreateTemplateBody) => Promise<TemplateDetail | null>;
}

const NO_STEPS: Record<ReplaceStep, StepState> = {
  create: 'waiting',
  assign: 'waiting',
  endOld: 'waiting',
};

/**
 * Swaps a template in use for a new version: create, assign the active inspectors, end the
 * old one. Three requests, not a transaction. Finished steps are remembered, so trying
 * again resumes rather than creating a second template.
 */
export function useReplaceTemplate(source: TemplateDetail): ReplaceTemplate {
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState(NO_STEPS);
  const [error, setError] = useState<ApiError | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const created = useRef<TemplateDetail | null>(null);
  const assigned = useRef(false);

  const run = useCallback(
    async (body: CreateTemplateBody): Promise<TemplateDetail | null> => {
      setIsRunning(true);
      setError(null);
      let step: ReplaceStep = 'create';
      try {
        if (!created.current) {
          created.current = await templatesApi.create(body);
          setSteps((s) => ({ ...s, create: 'done' }));
        }
        const template = created.current;

        step = 'assign';
        if (!assigned.current) {
          const active = source.assignees
            .filter((a) => a.isActive)
            .map((a) => a.id);
          if (active.length > 0) await templatesApi.assign(template.id, active);
          assigned.current = true;
          setSteps((s) => ({ ...s, assign: 'done' }));
        }

        step = 'endOld';
        const lastDay = previousDay(template.validFrom);
        // Leaves an old template alone if it already ends sooner.
        if (source.validTo === null || source.validTo > lastDay) {
          // Both dates, so a conflict gets the server's friendlier message.
          await templatesApi.update(source.id, {
            validFrom: source.validFrom,
            validTo: lastDay,
          });
        }
        setSteps((s) => ({ ...s, endOld: 'done' }));
        return template;
      } catch (err) {
        setSteps((s) => ({ ...s, [step]: 'failed' }));
        setError(toApiError(err));
        return null;
      } finally {
        setIsRunning(false);
        void queryClient.invalidateQueries({ queryKey: templatesKeys.all });
        void queryClient.invalidateQueries({ queryKey: projectsKeys.all });
        void queryClient.invalidateQueries({ queryKey: usersKeys.details });
      }
    },
    [queryClient, source],
  );

  return { steps, error, isRunning, run };
}
