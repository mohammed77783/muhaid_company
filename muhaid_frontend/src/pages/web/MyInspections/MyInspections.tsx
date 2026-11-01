import { useState, useTransition, type FormEvent, type JSX } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { Button } from '../../../components/Button';
import { DataTable, type Column } from '../../../components/DataTable';
import { EmptyState } from '../../../components/EmptyState';
import { FilterTag } from '../../../components/FilterBar';
import { InspectionCard } from '../../../components/InspectionCard';
import { Pagination } from '../../../components/Pagination';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { TextField } from '../../../components/TextField';
import { useLang, useT } from '../../../hooks/useI18n';
import { useMyInspections } from '../../../hooks/web/useMyInspections';
import { formatDateTime, formatDuration } from '../../../lib/dates';
import type { InspectionSummary } from '../../../types/api';
import type { ListReturnState } from '../InspectorLayout/InspectorLayout';
import styles from './MyInspections.module.css';

const LIMIT = 20;
/** Under this gap, the form effectively went straight out. */
const ON_TIME_MS = 60_000;

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function syncDelay(item: InspectionSummary): number {
  return (
    new Date(item.receivedAt).getTime() - new Date(item.filledAt).getTime()
  );
}

/** Keyed by the URL's value, so Back and the clear button always show in the box. */
function SearchForm({
  initial,
  onSearch,
}: {
  initial: string;
  onSearch: (workOrder: string) => void;
}): JSX.Element {
  const t = useT();
  const [draft, setDraft] = useState(initial);

  // An exact match, so it runs on submit rather than on every keystroke.
  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    onSearch(draft.trim());
  }

  return (
    <form
      role="search"
      className={styles.search}
      noValidate
      onSubmit={handleSubmit}
    >
      <TextField
        className={styles.searchField}
        label={t.sent.searchLabel}
        helperText={t.sent.searchHelp}
        code
        autoComplete="off"
        placeholder="WO-1042"
        maxLength={50}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <Button type="submit" variant="secondary" startIcon="search">
        {t.common.search}
      </Button>
    </form>
  );
}

function InspectionList(): JSX.Element {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const page = parsePage(searchParams.get('page'));
  const workOrder = searchParams.get('workOrder')?.trim() ?? '';
  const data = useMyInspections({
    page,
    limit: LIMIT,
    // An empty string would fail the API's 1-character minimum.
    ...(workOrder ? { workOrder } : {}),
  });

  const pageCount = Math.ceil(data.total / data.limit);
  const pagination = {
    page: data.page,
    pageCount,
    totalLabel: t.counts.results(data.total),
    onPageChange: (next: number) => goTo(next, workOrder),
  };

  // In a transition, so the current page stays on screen while the next one loads.
  function goTo(nextPage: number, nextWorkOrder: string): void {
    startTransition(() => {
      const next = new URLSearchParams();
      if (nextPage > 1) next.set('page', String(nextPage));
      if (nextWorkOrder) next.set('workOrder', nextWorkOrder);
      setSearchParams(next);
    });
  }

  function clearSearch(): void {
    goTo(1, '');
  }

  function open(item: InspectionSummary): void {
    const state: ListReturnState = { listSearch: search };
    void navigate(`/inspector/sent/${item.id}`, { state });
  }

  function delayLabel(item: InspectionSummary): string | undefined {
    const delay = syncDelay(item);
    return delay >= ON_TIME_MS
      ? t.sent.syncedLater(formatDuration(delay, lang))
      : undefined;
  }

  const columns: Column<InspectionSummary>[] = [
    {
      key: 'workOrder',
      label: t.sent.columnWorkOrder,
      code: true,
      render: (item) => (
        <Link
          to={`/inspector/sent/${item.id}`}
          state={{ listSearch: search } satisfies ListReturnState}
        >
          {item.workOrderNumber}
        </Link>
      ),
    },
    {
      key: 'template',
      label: t.sent.columnTemplate,
      render: (item) => <span dir="auto">{item.template.name}</span>,
    },
    {
      key: 'project',
      label: t.sent.columnProject,
      code: true,
      render: (item) => item.project.code,
    },
    {
      key: 'filledAt',
      label: t.sent.columnFilledAt,
      numeric: true,
      render: (item) => formatDateTime(item.filledAt),
    },
    {
      key: 'sync',
      label: t.sent.columnSync,
      render: (item) => delayLabel(item) ?? t.sent.onTime,
    },
  ];

  const isEmpty = data.items.length === 0;
  const empty = workOrder
    ? {
        icon: 'search' as const,
        title: t.sent.noMatchTitle,
        body: t.sent.noMatchBody,
        action: (
          <Button variant="secondary" onClick={clearSearch}>
            {t.common.clear}
          </Button>
        ),
      }
    : data.total > 0
      ? {
          icon: 'search' as const,
          title: t.sent.pastEndTitle,
          body: t.sent.pastEndBody,
          action: (
            <Button variant="secondary" onClick={() => goTo(1, '')}>
              {t.sent.firstPage}
            </Button>
          ),
        }
      : {
          icon: 'cloudCheck' as const,
          title: t.sent.emptyTitle,
          body: t.sent.emptyBody,
        };

  return (
    <div className={styles.root}>
      <SearchForm
        key={workOrder}
        initial={workOrder}
        onSearch={(value) => goTo(1, value)}
      />

      {workOrder && (
        <div>
          <FilterTag label={workOrder} onRemove={clearSearch} />
        </div>
      )}

      {/* A table on a phone is the wrong shape: cards below the tablet breakpoint. */}
      <div className={styles.table}>
        <DataTable
          columns={columns}
          rows={data.items}
          getRowKey={(item) => item.id}
          onRowClick={open}
          pending={isPending}
          empty={empty}
          pagination={isEmpty ? undefined : pagination}
        />
      </div>

      <div className={styles.cards} data-pending={isPending || undefined}>
        {isEmpty ? (
          <EmptyState {...empty} />
        ) : (
          <>
            {data.items.map((item) => (
              <InspectionCard
                key={item.id}
                title={item.template.name}
                workOrder={item.workOrderNumber}
                projectCode={item.project.code}
                date={formatDateTime(item.filledAt)}
                detail={delayLabel(item)}
                syncStatus="sent"
                onClick={() => open(item)}
              />
            ))}
            <Pagination {...pagination} className={styles.pager} />
          </>
        )}
      </div>
    </div>
  );
}

/** What was sent, kept clearly apart from the outbox: what hasn't gone yet. */
export function MyInspections(): JSX.Element {
  const t = useT();
  return (
    <RouteErrorBoundary
      backTo="/inspector/forms"
      networkBody={t.sent.downloadFirst}
    >
      <InspectionList />
    </RouteErrorBoundary>
  );
}
