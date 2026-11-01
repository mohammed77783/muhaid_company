import type { JSX } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/Button';
import { DataTable, type Column } from '../../../components/DataTable';
import { FilterBar } from '../../../components/FilterBar';
import { PageHeader } from '../../../components/PageHeader';
import { ProjectSelect } from '../../../components/ProjectSelect';
import { StatusChip } from '../../../components/StatusChip';
import { useTemplates } from '../../../hooks/admin/useTemplates';
import { useT } from '../../../hooks/useI18n';
import { useListSearchParams } from '../../../hooks/useListSearchParams';
import { formatDateTime, templateStatus } from '../../../lib/dates';
import { isUuid } from '../../../lib/isUuid';
import type { TemplateSummary } from '../../../types/admin/templates';
import styles from './Templates.module.css';

export function Templates(): JSX.Element {
  const t = useT();
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

  const rawProjectId = searchParams.get('projectId');
  const projectId = isUuid(rawProjectId) ? rawProjectId : '';
  const data = useTemplates({
    page,
    limit,
    ...(projectId ? { projectId } : {}),
  });

  const columns: Column<TemplateSummary>[] = [
    {
      key: 'name',
      label: t.templates.name,
      render: (template) => (
        <Link
          to={`/admin/templates/${template.id}`}
          state={{ listSearch: search }}
          dir="auto"
        >
          {template.name}
        </Link>
      ),
    },
    {
      key: 'project',
      label: t.templates.project,
      render: (template) => (
        <>
          <span className="code">{template.project.code}</span>
          {' — '}
          <span dir="auto">{template.project.name}</span>
        </>
      ),
    },
    {
      key: 'validFrom',
      label: t.templates.validFrom,
      numeric: true,
      render: (template) => template.validFrom,
    },
    {
      key: 'validTo',
      label: t.templates.validTo,
      numeric: true,
      render: (template) => template.validTo ?? '—',
    },
    {
      key: 'status',
      label: t.templates.status,
      render: (template) => (
        <StatusChip
          status={templateStatus(template.validFrom, template.validTo)}
          size="sm"
        />
      ),
    },
    {
      key: 'created',
      label: t.admin.created,
      numeric: true,
      render: (template) => formatDateTime(template.createdAt),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        actions={
          <Button
            startIcon="plus"
            onClick={() =>
              void navigate(
                `/admin/templates/new${projectId ? `?projectId=${projectId}` : ''}`,
              )
            }
          >
            {t.templates.add}
          </Button>
        }
      />
      <FilterBar>
        <ProjectSelect
          clearable
          value={projectId}
          onChange={(value) => setFilters({ projectId: value || null })}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={data.items}
        getRowKey={(template) => template.id}
        onRowClick={(template) =>
          void navigate(`/admin/templates/${template.id}`, {
            state: { listSearch: search },
          })
        }
        pending={isPending}
        empty={
          data.total > 0
            ? {
                icon: 'search',
                title: t.sent.pastEndTitle,
                body: t.sent.pastEndBody,
                action: (
                  <Button variant="secondary" onClick={() => setPage(1)}>
                    {t.sent.firstPage}
                  </Button>
                ),
              }
            : projectId
              ? {
                  icon: 'filter',
                  title: t.templates.noMatchTitle,
                  body: t.templates.noMatchBody,
                }
              : {
                  icon: 'building',
                  title: t.templates.emptyTitle,
                  body: t.templates.emptyBody,
                }
        }
        pagination={{
          page: data.page,
          pageCount: Math.ceil(data.total / data.limit),
          totalLabel: t.counts.results(data.total),
          onPageChange: setPage,
          limit: data.limit,
          onLimitChange: setLimit,
        }}
      />
    </div>
  );
}
