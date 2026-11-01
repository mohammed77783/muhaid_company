import { useState, type JSX } from 'react';
import { Link } from 'react-router-dom';

import { useUnassignInspector } from '../../hooks/admin/useTemplates';
import { useT } from '../../hooks/useI18n';
import { useSnackbar } from '../../hooks/useSnackbar';
import { formatDateTime } from '../../lib/dates';
import { errorMessage } from '../../lib/errorMessage';
import type { Assignee, TemplateDetail } from '../../types/admin/templates';
import { AssignInspectorsDialog } from '../AssignInspectorsDialog';
import { Button } from '../Button';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState } from '../EmptyState';
import { IconButton } from '../IconButton';
import { StatusChip } from '../StatusChip';
import styles from './AssigneesPanel.module.css';

interface AssigneesPanelProps {
  template: TemplateDetail;
}

/** Who can fill this template. A new template does nothing until someone is listed here. */
export function AssigneesPanel({ template }: AssigneesPanelProps): JSX.Element {
  const t = useT();
  const snackbar = useSnackbar();
  const unassign = useUnassignInspector(template.id);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<Assignee | null>(null);

  function handleRemove(): void {
    if (!removing) return;
    setRemoving(null);
    unassign.mutate(removing.id, {
      onError: (error) => {
        // 404: already removed by someone else, so there is nothing to report.
        if (error.status !== 404) {
          snackbar.show({ message: errorMessage(error, t), variant: 'error' });
        }
      },
    });
  }

  return (
    <section className={styles.root}>
      <div className={styles.head}>
        <h2 className={styles.heading}>{t.templates.assignees}</h2>
        <Button
          variant="secondary"
          startIcon="user"
          onClick={() => setAssigning(true)}
        >
          {t.templates.assign}
        </Button>
      </div>

      {template.assignees.length === 0 ? (
        <EmptyState
          icon="user"
          title={t.templates.noAssigneesTitle}
          body={t.templates.noAssigneesBody}
        />
      ) : (
        <ul className={styles.list}>
          {template.assignees.map((assignee) => (
            <li key={assignee.id} className={styles.row}>
              <div className={styles.person}>
                <Link to={`/admin/users/${assignee.id}`} dir="auto">
                  {assignee.name}
                </Link>
                <span className={styles.email}>{assignee.email}</span>
              </div>
              <span className="code">{assignee.workOrderNumber}</span>
              {assignee.completedAt && (
                <span>
                  {t.templates.submittedAt(
                    formatDateTime(assignee.completedAt),
                  )}
                </span>
              )}
              {!assignee.isActive && (
                <StatusChip status="deactivated" size="sm" />
              )}
              <IconButton
                icon="trash"
                variant="danger"
                size="sm"
                label={t.templates.removeAssignee(assignee.name)}
                onClick={() => setRemoving(assignee)}
              />
            </li>
          ))}
        </ul>
      )}

      {assigning && (
        <AssignInspectorsDialog
          template={template}
          onClose={() => setAssigning(false)}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        variant="danger"
        title={removing ? t.templates.removeTitle(removing.name) : ''}
        confirmLabel={t.templates.removeConfirm}
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      >
        {t.templates.removeBody}
      </ConfirmDialog>
    </section>
  );
}
