import { useState, type JSX } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/Button';
import { DataTable, type Column } from '../../../components/DataTable';
import { PageHeader } from '../../../components/PageHeader';
import { CreateProjectDialog } from '../../../components/ProjectFormDialog';
import { useProjects } from '../../../hooks/admin/useProjects';
import { useT } from '../../../hooks/useI18n';
import { useListSearchParams } from '../../../hooks/useListSearchParams';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { formatDateTime } from '../../../lib/dates';
import type { Project } from '../../../types/admin/projects';
import styles from './Projects.module.css';

export function Projects(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const { search } = useLocation();
  const snackbar = useSnackbar();
  const { page, limit, isPending, setPage, setLimit } = useListSearchParams();
  const [creating, setCreating] = useState(false);
  const data = useProjects({ page, limit });

  const columns: Column<Project>[] = [
    {
      key: 'code',
      label: t.projects.code,
      code: true,
      render: (project) => (
        <Link
          to={`/admin/projects/${project.id}`}
          state={{ listSearch: search }}
        >
          {project.code}
        </Link>
      ),
    },
    {
      key: 'name',
      label: t.projects.name,
      render: (project) => <span dir="auto">{project.name}</span>,
    },
    {
      key: 'created',
      label: t.admin.created,
      numeric: true,
      render: (project) => formatDateTime(project.createdAt),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        actions={
          <Button startIcon="plus" onClick={() => setCreating(true)}>
            {t.projects.add}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={data.items}
        getRowKey={(project) => project.id}
        onRowClick={(project) =>
          void navigate(`/admin/projects/${project.id}`, {
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
            : {
                icon: 'folder',
                title: t.projects.emptyTitle,
                body: t.projects.emptyBody,
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
      {creating && (
        <CreateProjectDialog
          onClose={() => setCreating(false)}
          onCreated={(project) => {
            setCreating(false);
            snackbar.show({ message: t.projects.created, variant: 'success' });
            // Its page leads to the next step: creating its first template.
            void navigate(`/admin/projects/${project.id}`);
          }}
        />
      )}
    </div>
  );
}
