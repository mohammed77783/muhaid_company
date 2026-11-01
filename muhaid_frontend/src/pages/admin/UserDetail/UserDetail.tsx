import { useState, type JSX } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../../components/Button';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { DataTable, type Column } from '../../../components/DataTable';
import { EditUserDialog } from '../../../components/EditUserDialog';
import { Fact, Facts } from '../../../components/Facts';
import { PageHeader } from '../../../components/PageHeader';
import { ResetPasswordDialog } from '../../../components/ResetPasswordDialog';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { StatusChip } from '../../../components/StatusChip';
import { Switch } from '../../../components/Switch';
import { useUpdateUser, useUser } from '../../../hooks/admin/useUsers';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useT } from '../../../hooks/useI18n';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { formatDateTime, templateStatus } from '../../../lib/dates';
import { errorMessage } from '../../../lib/errorMessage';
import type { UserTemplate } from '../../../types/admin/users';
import styles from './UserDetail.module.css';

const LIST_PATH = '/admin/users';

function UserContent({ id }: { id: string }): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const { state } = useLocation();
  const snackbar = useSnackbar();
  const currentUser = useCurrentUser();
  const user = useUser(id);
  const update = useUpdateUser(id);

  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmingActive, setConfirmingActive] = useState(false);

  // The server refuses both anyway; the page explains instead of offering them.
  const isSelf = user.id === currentUser.id;
  const listPath =
    LIST_PATH + ((state as { listSearch?: string } | null)?.listSearch ?? '');

  function handleToggleActive(): void {
    update.mutate(
      { isActive: !user.isActive },
      {
        onSuccess: () => {
          setConfirmingActive(false);
          snackbar.show({ message: t.users.updated, variant: 'success' });
        },
        onError: (error) => {
          setConfirmingActive(false);
          snackbar.show({ message: errorMessage(error, t), variant: 'error' });
          if (error.status === 404) void navigate(LIST_PATH);
        },
      },
    );
  }

  const columns: Column<UserTemplate>[] = [
    {
      key: 'project',
      label: t.users.columnProject,
      render: (template) => (
        <>
          <span className="code">{template.project.code}</span>{' '}
          <span dir="auto">{template.project.name}</span>
        </>
      ),
    },
    {
      key: 'template',
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
    {
      key: 'assigned',
      label: t.users.columnAssigned,
      numeric: true,
      render: (template) => formatDateTime(template.assignedAt),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        breadcrumbs={[
          { label: t.admin.users, to: listPath },
          { label: user.name },
        ]}
        title={user.name}
        actions={
          <>
            <Button variant="secondary" onClick={() => setResetting(true)}>
              {t.users.resetPassword}
            </Button>
            <Button onClick={() => setEditing(true)}>{t.common.edit}</Button>
          </>
        }
      />

      <Facts>
        <Fact label={t.users.email}>
          <span className="iso">{user.email}</span>
        </Fact>
        <Fact label={t.users.role}>{t.roles[user.role]}</Fact>
        <Fact label={t.users.status}>
          <StatusChip status={user.isActive ? 'userActive' : 'deactivated'} />
        </Fact>
        <Fact label={t.admin.created}>
          <span className="iso tnum">{formatDateTime(user.createdAt)}</span>
        </Fact>
      </Facts>

      <div className={styles.activeRow}>
        <Switch
          label={t.users.accountActive}
          checked={user.isActive}
          stateText={
            user.isActive ? t.users.filterActive : t.users.filterInactive
          }
          disabled={isSelf}
          onChange={() => setConfirmingActive(true)}
        />
        {isSelf && <p className={styles.selfNote}>{t.users.selfActive}</p>}
      </div>

      {/* Admins can't fill forms, so assignments don't apply to them. */}
      {user.role === 'inspector' && (
        <section className={styles.section}>
          <h2 className={styles.heading}>{t.users.assignedTemplates}</h2>
          <DataTable
            columns={columns}
            rows={user.templates}
            getRowKey={(template) => template.id}
            onRowClick={(template) =>
              void navigate(`/admin/templates/${template.id}`)
            }
            empty={{
              icon: 'clipboard',
              title: t.users.noTemplatesTitle,
              body: t.users.noTemplatesBody,
              action: (
                <Button
                  variant="secondary"
                  onClick={() => void navigate('/admin/templates')}
                >
                  {t.admin.templates}
                </Button>
              ),
            }}
          />
        </section>
      )}

      {editing && (
        <EditUserDialog
          user={user}
          isSelf={isSelf}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            snackbar.show({ message: t.users.updated, variant: 'success' });
          }}
        />
      )}
      {resetting && (
        <ResetPasswordDialog
          userId={user.id}
          onClose={() => setResetting(false)}
          onSaved={() => {
            setResetting(false);
            snackbar.show({ message: t.users.resetDone, variant: 'success' });
          }}
        />
      )}
      <ConfirmDialog
        open={confirmingActive}
        variant={user.isActive ? 'danger' : 'warning'}
        title={
          user.isActive
            ? t.users.deactivateTitle(user.name)
            : t.users.reactivateTitle(user.name)
        }
        confirmLabel={
          user.isActive ? t.users.deactivateConfirm : t.users.reactivateConfirm
        }
        loading={update.isPending}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmingActive(false)}
      >
        {user.isActive ? t.users.deactivateBody : t.users.reactivateBody}
      </ConfirmDialog>
    </div>
  );
}

export function UserDetail(): JSX.Element {
  const t = useT();
  const { id = '' } = useParams();
  return (
    <RouteErrorBoundary
      backTo={LIST_PATH}
      backLabel={t.admin.backTo.users}
      notFoundTitle={t.users.notFoundTitle}
      notFoundBody={t.users.notFoundBody}
    >
      <UserContent key={id} id={id} />
    </RouteErrorBoundary>
  );
}
