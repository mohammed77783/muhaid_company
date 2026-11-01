import { useState, type JSX } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/Button';
import { CreateUserDialog } from '../../../components/CreateUserDialog';
import { DataTable, type Column } from '../../../components/DataTable';
import {
  FilterBar,
  FilterTag,
  FilterTags,
} from '../../../components/FilterBar';
import { PageHeader } from '../../../components/PageHeader';
import { Select } from '../../../components/Select';
import { StatusChip } from '../../../components/StatusChip';
import { useUsers } from '../../../hooks/admin/useUsers';
import { useT } from '../../../hooks/useI18n';
import { useListSearchParams } from '../../../hooks/useListSearchParams';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { formatDateTime } from '../../../lib/dates';
import type { User } from '../../../types/admin/users';
import type { Role } from '../../../types/api';
import styles from './Users.module.css';

function parseRole(raw: string | null): Role | undefined {
  return raw === 'admin' || raw === 'inspector' ? raw : undefined;
}

function parseIsActive(raw: string | null): boolean | undefined {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}

export function Users(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const { search } = useLocation();
  const snackbar = useSnackbar();
  const {
    page,
    limit,
    searchParams,
    isPending,
    setPage,
    setLimit,
    setFilters,
  } = useListSearchParams();
  const [creating, setCreating] = useState(false);

  const role = parseRole(searchParams.get('role'));
  const isActive = parseIsActive(searchParams.get('isActive'));
  const hasFilters = role !== undefined || isActive !== undefined;

  // "All" means the param is left out.
  const data = useUsers({
    page,
    limit,
    ...(role ? { role } : {}),
    ...(isActive === undefined ? {} : { isActive }),
  });

  function open(user: User): void {
    void navigate(`/admin/users/${user.id}`, {
      state: { listSearch: search },
    });
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: t.users.name,
      render: (user) => (
        <Link
          to={`/admin/users/${user.id}`}
          state={{ listSearch: search }}
          dir="auto"
        >
          {user.name}
        </Link>
      ),
    },
    {
      key: 'email',
      label: t.users.email,
      render: (user) => <span className="iso">{user.email}</span>,
    },
    {
      key: 'role',
      label: t.users.role,
      render: (user) => t.roles[user.role],
    },
    {
      key: 'status',
      label: t.users.status,
      render: (user) => (
        <StatusChip
          status={user.isActive ? 'userActive' : 'deactivated'}
          size="sm"
        />
      ),
    },
    {
      key: 'created',
      label: t.admin.created,
      numeric: true,
      render: (user) => formatDateTime(user.createdAt),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        actions={
          <Button startIcon="plus" onClick={() => setCreating(true)}>
            {t.users.add}
          </Button>
        }
      />

      <FilterBar>
        <Select
          label={t.users.role}
          placeholder={t.users.filterAll}
          value={role ?? ''}
          options={[
            { value: 'inspector', label: t.roles.inspector },
            { value: 'admin', label: t.roles.admin },
          ]}
          onChange={(e) => setFilters({ role: e.target.value })}
        />
        <Select
          label={t.users.status}
          placeholder={t.users.filterAll}
          value={isActive === undefined ? '' : String(isActive)}
          options={[
            { value: 'true', label: t.users.filterActive },
            { value: 'false', label: t.users.filterInactive },
          ]}
          onChange={(e) => setFilters({ isActive: e.target.value })}
        />
      </FilterBar>

      {hasFilters && (
        <FilterTags>
          {role && (
            <FilterTag
              label={`${t.users.role}: ${t.roles[role]}`}
              onRemove={() => setFilters({ role: null })}
            />
          )}
          {isActive !== undefined && (
            <FilterTag
              label={`${t.users.status}: ${
                isActive ? t.users.filterActive : t.users.filterInactive
              }`}
              onRemove={() => setFilters({ isActive: null })}
            />
          )}
          <Button
            variant="text"
            size="sm"
            onClick={() => setFilters({ role: null, isActive: null })}
          >
            {t.filters.clearAll}
          </Button>
        </FilterTags>
      )}

      <DataTable
        columns={columns}
        rows={data.items}
        getRowKey={(user) => user.id}
        onRowClick={open}
        isRowDimmed={(user) => !user.isActive}
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
            : hasFilters
              ? {
                  icon: 'filter',
                  title: t.users.noMatchTitle,
                  body: t.users.noMatchBody,
                }
              : {
                  icon: 'user',
                  title: t.users.emptyTitle,
                  body: t.users.emptyBody,
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
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onCreated={(user) => {
            setCreating(false);
            snackbar.show({
              message: t.users.created(user.name),
              variant: 'success',
            });
            // Inspectors can't do anything until they are assigned, so go there next.
            void navigate(`/admin/users/${user.id}`);
          }}
        />
      )}
    </div>
  );
}
