import { useState, type JSX } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../../components/Button';
import { DataTable, type Column } from '../../../components/DataTable';
import { PageHeader } from '../../../components/PageHeader';
import { EditProjectDialog } from '../../../components/ProjectFormDialog';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { StatusChip } from '../../../components/StatusChip';
import { useProject } from '../../../hooks/admin/useProjects';
import { useT } from '../../../hooks/useI18n';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { templateStatus } from '../../../lib/dates';
import type { ProjectDetail as ProjectDetailData } from '../../../types/admin/projects';
import styles from './ProjectDetail.module.css';

const LIST_PATH = '/admin/projects';

type ProjectTemplate = ProjectDetailData['templates'][number];

function ProjectContent({ id }: { id: string }): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const { state } = useLocation();
  const snackbar = useSnackbar();
  const project = useProject(id);
  const [editing, setEditing] = useState(false);

  const listPath =
    LIST_PATH + ((state as { listSearch?: string } | null)?.listSearch ?? '');
  const newTemplatePath = `/admin/templates/new?projectId=${project.id}`;

  const columns: Column<ProjectTemplate>[] = [
    {
      key: 'name',
      label: t.users.columnTemplate,
      render: (template) => (
        <Link to={`/admin/templates/${template.id}`} dir="auto">
          {template.name}
        </Link>
      ),
    },
    {
      key: 'validity',
      label: t.users.columnValidity,
      numeric: true,
      render: (template) =>
        `${template.validFrom} → ${template.validTo ?? t.common.noEndDate}`,
    },
    {
      key: 'status',
      label: t.users.columnStatus,
      render: (template) => (
        <StatusChip
          status={templateStatus(template.validFrom, template.validTo)}
          size="sm"
        />
      ),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        breadcrumbs={[
          { label: t.admin.projects, to: listPath },
          { label: project.code },
        ]}
        title={project.name}
        subtitle={<span className="code">{project.code}</span>}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                void navigate(`/admin/inspections?projectId=${project.id}`)
              }
            >
              {t.projects.viewInspections}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              {t.common.edit}
            </Button>
            <Button
              startIcon="plus"
              onClick={() => void navigate(newTemplatePath)}
            >
              {t.projects.newTemplate}
            </Button>
          </>
        }
      />
      <section className={styles.section}>
        <h2 className={styles.heading}>{t.projects.templates}</h2>
        <DataTable
          columns={columns}
          rows={project.templates}
          getRowKey={(template) => template.id}
          onRowClick={(template) =>
            void navigate(`/admin/templates/${template.id}`)
          }
          empty={{
            icon: 'clipboard',
            title: t.projects.noTemplatesTitle,
            body: t.projects.noTemplatesBody,
          }}
        />
      </section>
      {editing && (
        <EditProjectDialog
          project={project}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            snackbar.show({ message: t.projects.updated, variant: 'success' });
          }}
        />
      )}
    </div>
  );
}

export function ProjectDetail(): JSX.Element {
  const t = useT();
  const { id = '' } = useParams();
  return (
    <RouteErrorBoundary
      backTo={LIST_PATH}
      backLabel={t.admin.backTo.projects}
      notFoundTitle={t.projects.notFoundTitle}
      notFoundBody={t.projects.notFoundBody}
    >
      <ProjectContent key={id} id={id} />
    </RouteErrorBoundary>
  );
}
