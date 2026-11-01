import { useCallback, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';

const LIMITS = [10, 20, 50];
const DEFAULT_LIMIT = 20;

interface ListSearchParams {
  page: number;
  limit: number;
  /** The URL's other values, for the page's own filters. */
  searchParams: URLSearchParams;
  /** True while the next page loads: the current one stays on screen. */
  isPending: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  /** Sets filters, null or empty removes one. Goes back to page 1. */
  setFilters: (changes: Record<string, string | null>) => void;
}

/**
 * A paginated list's state lives in the URL, so a refresh or a shared link reopens the
 * same view. A hand-edited value falls back to its default instead of a 400 from the API.
 */
export function useListSearchParams(): ListSearchParams {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const rawLimit = Number(searchParams.get('limit'));
  const limit = LIMITS.includes(rawLimit) ? rawLimit : DEFAULT_LIMIT;

  const change = useCallback(
    (edit: (next: URLSearchParams) => void) => {
      // In a transition, so the current page stays visible while the next one loads.
      startTransition(() => {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          edit(next);
          return next;
        });
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (value: number) => {
      change((next) => {
        if (value > 1) next.set('page', String(value));
        else next.delete('page');
      });
    },
    [change],
  );

  const setLimit = useCallback(
    (value: number) => {
      change((next) => {
        next.delete('page');
        if (value === DEFAULT_LIMIT) next.delete('limit');
        else next.set('limit', String(value));
      });
    },
    [change],
  );

  const setFilters = useCallback(
    (changes: Record<string, string | null>) => {
      change((next) => {
        next.delete('page');
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
      });
    },
    [change],
  );

  return {
    page,
    limit,
    searchParams,
    isPending,
    setPage,
    setLimit,
    setFilters,
  };
}
