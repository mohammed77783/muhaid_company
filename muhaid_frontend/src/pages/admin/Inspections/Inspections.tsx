import { useState, type FormEvent, type JSX } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Autocomplete } from '../../../components/Autocomplete';
import { Button } from '../../../components/Button';
import { DataTable, type Column } from '../../../components/DataTable';
import { DatePicker } from '../../../components/DatePicker';
import { EmptyState } from '../../../components/EmptyState';
import {
  FilterBar,
  FilterTag,
  FilterTags,
} from '../../../components/FilterBar';
import { InspectionCard } from '../../../components/InspectionCard';
import { Pagination } from '../../../components/Pagination';
import { ProjectSelect } from '../../../components/ProjectSelect';
import { TextField } from '../../../components/TextField';
import { useInspections } from '../../../hooks/admin/useInspections';
import { useAllProjects } from '../../../hooks/admin/useProjects';
import { useAllTemplates } from '../../../hooks/admin/useTemplates';
import { useAllInspectors } from '../../../hooks/admin/useUsers';
import { useLang, useT } from '../../../hooks/useI18n';
import { useListSearchParams } from '../../../hooks/useListSearchParams';
import {
  endOfDayIso,
  formatDateTime,
  formatDuration,
  isCalendarDate,
  startOfDayIso,
} from '../../../lib/dates';
import { isUuid } from '../../../lib/isUuid';
import type { InspectionSummary } from '../../../types/api';
import styles from './Inspections.module.css';

/** Under this, a form effectively went straight out. */
const ON_TIME_MS = 5 * 60_000;

function WorkOrderSearch({
  initial,
  onSearch,
}: {
  initial: string;
  onSearch: (value: string) => void;
}): JSX.Element {
  const t = useT();
  const [draft, setDraft] = useState(initial);
  // An exact match, so it runs on Enter rather than on every keystroke.
  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    onSearch(draft.trim());
  }
  return (
    <form role="search" noValidate onSubmit={handleSubmit}>
      <TextField
        label={t.inspections.workOrder}
        helperText={t.inspections.workOrderHelp}
        code
        autoComplete="off"
        placeholder="WO-1042"
        maxLength={50}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
    </form>
  );
}

/** The review side of the product: find inspections, open one, read what was found. */
export function Inspections(): JSX.Element {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const { search } = useLocation();
  const {
    page,
    limit,
    searchParams,
    isPending,
    setPage,
    setLimit,
    setFilters,
  } = useListSearchParams();

  // A hand-edited value is dropped rather than answered with a 400.
  const uuidParam = (name: string): string => {
    const raw = searchParams.get(name);
    return isUuid(raw) ? raw : '';
  };
  const dateParam = (name: string): string => {
    const raw = searchParams.get(name) ?? '';
    return isCalendarDate(raw) ? raw : '';
  };
  const projectId = uuidParam('projectId');
  const templateId = uuidParam('templateId');
  const inspectorId = uuidParam('inspectorId');
  const from = dateParam('from');
  const to = dateParam('to');
  const workOrder = searchParams.get('workOrder')?.trim() ?? '';
  const hasFilters = Boolean(
    projectId || templateId || inspectorId || from || to || workOrder,
  );

  const projects = useAllProjects();
  const templates = useAllTemplates(projectId);
  // Inactive inspectors too: their history still matters.
  const inspectors = useAllInspectors({ activeOnly: false });

  const data = useInspections({
    page,
    limit,
    ...(workOrder ? { workOrder } : {}),
    ...(projectId ? { projectId } : {}),
    ...(templateId ? { templateId } : {}),
    ...(inspectorId ? { inspectorId } : {}),
    // Calendar days in the admin's own timezone, sent as exact instants.
    ...(from ? { from: startOfDayIso(from) } : {}),
    ...(to ? { to: endOfDayIso(to) } : {}),
  });

  const project = projects.find((p) => p.id === projectId);
  const template = templates.find((x) => x.id === templateId);
  const inspector = inspectors.find((i) => i.id === inspectorId);

  function open(item: InspectionSummary): void {
    void navigate(`/admin/inspections/${item.id}`, {
      state: { listSearch: search },
    });
  }

  function syncLabel(item: InspectionSummary): string {
    const delay =
      new Date(item.receivedAt).getTime() - new Date(item.filledAt).getTime();
    return delay < ON_TIME_MS
      ? t.inspections.onTime
      : t.inspections.late(formatDuration(delay, lang));
  }

  const columns: Column<InspectionSummary>[] = [
    {
      key: 'workOrder',
      label: t.inspections.workOrder,
      code: true,
      render: (item) => (
        <Link
          to={`/admin/inspections/${item.id}`}
          state={{ listSearch: search }}
        >
          {item.workOrderNumber}
        </Link>
      ),
    },
    {
      key: 'project',
      label: t.inspections.project,
      code: true,
      render: (item) => item.project.code,
    },
    {
      key: 'template',
      label: t.inspections.template,
      render: (item) => <span dir="auto">{item.template.name}</span>,
    },
    {
      key: 'inspector',
      label: t.inspections.inspector,
      render: (item) => <span dir="auto">{item.inspector.name}</span>,
    },
    {
      key: 'filledAt',
      label: t.inspections.filledAt,
      numeric: true,
      render: (item) => formatDateTime(item.filledAt),
    },
    {
      key: 'receivedAt',
      label: t.inspections.receivedAt,
      numeric: true,
      render: (item) => formatDateTime(item.receivedAt),
    },
    {
      key: 'sync',
      label: t.inspections.syncDelay,
      render: syncLabel,
    },
  ];

  const empty =
    data.total > 0
      ? {
          icon: 'search' as const,
          title: t.sent.pastEndTitle,
          body: t.sent.pastEndBody,
          action: (
            <Button variant="secondary" onClick={() => setPage(1)}>
              {t.sent.firstPage}
            </Button>
          ),
        }
      : hasFilters
        ? {
            icon: 'filter' as const,
            title: t.inspections.noMatchTitle,
            body: t.inspections.noMatchBody,
          }
        : {
            icon: 'clipboard' as const,
            title: t.inspections.emptyTitle,
            body: t.inspections.emptyBody,
          };

  const pagination = {
    page: data.page,
    pageCount: Math.ceil(data.total / data.limit),
    totalLabel: t.counts.results(data.total),
    onPageChange: setPage,
    limit: data.limit,
    onLimitChange: setLimit,
  };

  return (
    <div className={styles.root}>
      <FilterBar>
        <ProjectSelect
          clearable
          value={projectId}
          // A template belongs to one project, so choosing another clears it.
          onChange={(value) =>
            setFilters({ projectId: value || null, templateId: null })
          }
        />
        <Autocomplete
          clearable
          label={t.inspections.template}
          placeholder={t.inspections.searchPlaceholder}
          value={templateId}
          options={templates.map((x) => ({
            value: x.id,
            label: x.name,
            code: x.project.code,
          }))}
          onChange={(value) => setFilters({ templateId: value || null })}
        />
        <Autocomplete
          clearable
          label={t.inspections.inspector}
          placeholder={t.inspections.searchPlaceholder}
          value={inspectorId}
          options={inspectors.map((i) => ({
            value: i.id,
            label: i.name,
          }))}
          onChange={(value) => setFilters({ inspectorId: value || null })}
        />
        <DatePicker
          label={t.inspections.from}
          value={from}
          onChange={(e) => setFilters({ from: e.target.value })}
        />
        <DatePicker
          label={t.inspections.to}
          value={to}
          error={from && to && to < from ? t.inspections.toBeforeFrom : null}
          onChange={(e) => setFilters({ to: e.target.value })}
        />
        <WorkOrderSearch
          key={workOrder}
          initial={workOrder}
          onSearch={(value) => setFilters({ workOrder: value })}
        />
      </FilterBar>

      {hasFilters && (
        <FilterTags>
          {project && (
            <FilterTag
              label={t.inspections.tagProject(project.name)}
              onRemove={() => setFilters({ projectId: null, templateId: null })}
            />
          )}
          {template && (
            <FilterTag
              label={t.inspections.tagTemplate(template.name)}
              onRemove={() => setFilters({ templateId: null })}
            />
          )}
          {inspector && (
            <FilterTag
              label={t.inspections.tagInspector(inspector.name)}
              onRemove={() => setFilters({ inspectorId: null })}
            />
          )}
          {(from || to) && (
            <FilterTag
              label={`${from || '…'} → ${to || '…'}`}
              onRemove={() => setFilters({ from: null, to: null })}
            />
          )}
          {workOrder && (
            <FilterTag
              label={t.inspections.tagWorkOrder(workOrder)}
              onRemove={() => setFilters({ workOrder: null })}
            />
          )}
          <Button
            variant="text"
            size="sm"
            onClick={() =>
              setFilters({
                projectId: null,
                templateId: null,
                inspectorId: null,
                from: null,
                to: null,
                workOrder: null,
              })
            }
          >
            {t.filters.clearAll}
          </Button>
        </FilterTags>
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
          pagination={pagination}
        />
      </div>
      <div className={styles.cards} data-pending={isPending || undefined}>
        {data.items.length === 0 ? (
          <EmptyState {...empty} />
        ) : (
          <>
            {data.items.map((item) => (
              <InspectionCard
                key={item.id}
                title={item.template.name}
                workOrder={item.workOrderNumber}
                projectCode={item.project.code}
                inspector={item.inspector.name}
                date={formatDateTime(item.filledAt)}
                detail={syncLabel(item)}
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
