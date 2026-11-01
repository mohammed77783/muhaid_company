import { useId, useState, type FormEvent, type JSX } from 'react';

import { useUpdateUser } from '../../hooks/admin/useUsers';
import { useT } from '../../hooks/useI18n';
import { fieldErrors } from '../../lib/apiError';
import { errorMessage } from '../../lib/errorMessage';
import type { User } from '../../types/admin/users';
import type { Role } from '../../types/api';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { Select } from '../Select';
import { TextField } from '../TextField';
import styles from './EditUserDialog.module.css';

interface EditUserDialogProps {
  user: User;
  /** The server refuses removing your own admin role, so the field is locked. */
  isSelf: boolean;
  onSaved: () => void;
  onClose: () => void;
}

export function EditUserDialog({
  user,
  isSelf,
  onSaved,
  onClose,
}: EditUserDialogProps): JSX.Element {
  const t = useT();
  const formId = useId();
  const update = useUpdateUser(user.id);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [attempted, setAttempted] = useState(false);

  const trimmed = name.trim();
  const nameProblem =
    trimmed.length < 1
      ? t.users.nameRequired
      : trimmed.length > 200
        ? t.users.nameTooLong
        : null;
  const unchanged = trimmed === user.name && role === user.role;
  const promoting = user.role === 'inspector' && role === 'admin';

  const error = update.error;
  const serverFields = error?.status === 400 ? fieldErrors(error) : {};

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setAttempted(true);
    if (nameProblem || unchanged) return;
    // Only what changed: an empty body is a 400 "Nothing to update".
    update.mutate(
      {
        ...(trimmed !== user.name ? { name: trimmed } : {}),
        ...(role !== user.role ? { role } : {}),
      },
      { onSuccess: onSaved },
    );
  }

  return (
    <Dialog
      title={t.users.editTitle}
      onClose={update.isPending ? false : onClose}
      actions={
        <>
          <Button variant="text" disabled={update.isPending} onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={update.isPending}
            disabled={unchanged}
          >
            {t.common.save}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={styles.form}
        noValidate
        onSubmit={handleSubmit}
      >
        <TextField
          label={t.users.name}
          required
          autoComplete="off"
          value={name}
          error={(attempted ? nameProblem : null) ?? serverFields.name?.[0]}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label={t.users.email}
          inputDir="ltr"
          value={user.email}
          helperText={t.users.emailReadOnly}
          disabled
        />
        <Select
          label={t.users.role}
          disabled={isSelf}
          helperText={isSelf ? t.users.selfRole : undefined}
          value={role}
          options={[
            { value: 'inspector', label: t.roles.inspector },
            { value: 'admin', label: t.roles.admin },
          ]}
          onChange={(e) => setRole(e.target.value as Role)}
        />
        {promoting && <Alert variant="warning">{t.users.promoteWarning}</Alert>}
        {error && !serverFields.name && (
          <Alert variant="error">{errorMessage(error, t)}</Alert>
        )}
      </form>
    </Dialog>
  );
}
