import { useState, type JSX } from 'react';

import { useAllInspectors } from '../../hooks/admin/useUsers';
import { useAssignInspectors } from '../../hooks/admin/useTemplates';
import { useT } from '../../hooks/useI18n';
import { useSnackbar } from '../../hooks/useSnackbar';
import { errorMessage } from '../../lib/errorMessage';
import type { TemplateDetail } from '../../types/admin/templates';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Dialog } from '../Dialog';
import { Skeleton } from '../Skeleton';
import { SuspenseLoader } from '../SuspenseLoader';
import { TextField } from '../TextField';
import styles from './AssignInspectorsDialog.module.css';

interface AssignInspectorsDialogProps {
  template: TemplateDetail;
  onClose: () => void;
}

function matches(text: string, query: string): boolean {
  return text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

function CandidateList({
  template,
  selected,
  invalid,
  onToggle,
}: {
  template: TemplateDetail;
  selected: Set<string>;
  invalid: Set<string>;
  onToggle: (id: string) => void;
}): JSX.Element {
  const t = useT();
  const inspectors = useAllInspectors({ activeOnly: true });
  const [query, setQuery] = useState('');
  const assignedIds = new Set(template.assignees.map((a) => a.id));
  const shown = inspectors.filter(
    (i) => matches(i.name, query) || matches(i.email, query),
  );

  if (inspectors.length === 0) {
    return <p className={styles.none}>{t.templates.noCandidates}</p>;
  }

  return (
    <>
      <TextField
        label={t.templates.assignSearch}
        startIcon="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className={styles.list}>
        {shown.map((inspector) => {
          const assigned = assignedIds.has(inspector.id);
          return (
            <li key={inspector.id} className={styles.row}>
              <Checkbox
                checked={assigned || selected.has(inspector.id)}
                disabled={assigned || invalid.has(inspector.id)}
                error={invalid.has(inspector.id)}
                onChange={() => onToggle(inspector.id)}
                label={
                  <span className={styles.person}>
                    <span dir="auto">{inspector.name}</span>
                    <span className={styles.email}>{inspector.email}</span>
                  </span>
                }
              />
              {assigned && (
                <span className={styles.note}>
                  {t.templates.alreadyAssigned}
                </span>
              )}
              {invalid.has(inspector.id) && (
                <span className={styles.invalid}>
                  {t.templates.invalidAssignee}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function AssignInspectorsDialog({
  template,
  onClose,
}: AssignInspectorsDialogProps): JSX.Element {
  const t = useT();
  const snackbar = useSnackbar();
  const assign = useAssignInspectors(template.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [invalid, setInvalid] = useState<Set<string>>(new Set());

  function toggle(id: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAssign(): void {
    assign.mutate([...selected], {
      onSuccess: () => {
        snackbar.show({ message: t.templates.assigned, variant: 'success' });
        onClose();
      },
      onError: (error) => {
        const ids = error.body.invalidUserIds;
        if (Array.isArray(ids)) {
          // Someone was deactivated or promoted after this list loaded. Nobody was assigned.
          const bad = new Set(ids.map(String));
          setInvalid((current) => new Set([...current, ...bad]));
          setSelected(
            (current) => new Set([...current].filter((id) => !bad.has(id))),
          );
        } else if (error.status === 404) {
          snackbar.show({ message: errorMessage(error, t), variant: 'error' });
          onClose();
        }
      },
    });
  }

  const error = assign.error;
  const hasInvalidIds = error && Array.isArray(error.body.invalidUserIds);

  return (
    <Dialog
      title={t.templates.assignTitle}
      size="wide"
      onClose={assign.isPending ? false : onClose}
      actions={
        <>
          <Button variant="text" disabled={assign.isPending} onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            loading={assign.isPending}
            disabled={selected.size === 0}
            onClick={handleAssign}
          >
            {t.templates.assignSubmit(selected.size)}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        {hasInvalidIds && (
          <Alert variant="error">{t.templates.invalidAssignees}</Alert>
        )}
        {error && !hasInvalidIds && error.status !== 404 && (
          <Alert variant="error">{errorMessage(error, t)}</Alert>
        )}
        <SuspenseLoader fallback={<Skeleton lines={6} />}>
          <CandidateList
            template={template}
            selected={selected}
            invalid={invalid}
            onToggle={toggle}
          />
        </SuspenseLoader>
      </div>
    </Dialog>
  );
}
