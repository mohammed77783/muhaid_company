import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { useT } from '../../hooks/useI18n';
import { useLogout } from '../../hooks/useLogout';
import { homePath } from '../../lib/routes';
import type { Role } from '../../types/api';
import { Button } from '../Button';
import { EmptyState } from '../EmptyState';
import styles from './WrongRoleScreen.module.css';

interface WrongRoleScreenProps {
  /** The role these pages are for. The account has the other one. */
  expected: Role;
}

/** Not an error and not a dead end: says where this account belongs and links to it. */
export function WrongRoleScreen({
  expected,
}: WrongRoleScreenProps): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const logout = useLogout();
  const forInspectors = expected === 'inspector';
  return (
    <EmptyState
      icon="lock"
      title={
        forInspectors ? t.wrongRole.inspectorTitle : t.wrongRole.adminTitle
      }
      body={forInspectors ? t.wrongRole.inspectorBody : t.wrongRole.adminBody}
      action={
        <div className={styles.actions}>
          <Button
            onClick={() =>
              void navigate(homePath(forInspectors ? 'admin' : 'inspector'))
            }
          >
            {forInspectors
              ? t.wrongRole.inspectorAction
              : t.wrongRole.adminAction}
          </Button>
          <Button variant="text" startIcon="logout" onClick={logout}>
            {t.common.logout}
          </Button>
        </div>
      }
    />
  );
}
