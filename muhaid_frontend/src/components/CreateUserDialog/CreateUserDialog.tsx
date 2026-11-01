import { useId, useState, type FormEvent, type JSX } from 'react';

import { useCreateUser } from '../../hooks/admin/useUsers';
import { useT } from '../../hooks/useI18n';
import { fieldErrors } from '../../lib/apiError';
import { errorMessage } from '../../lib/errorMessage';
import { generatePassword } from '../../lib/password';
import type { User } from '../../types/admin/users';
import type { Role } from '../../types/api';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { Select } from '../Select';
import { TextField } from '../TextField';
import styles from './CreateUserDialog.module.css';

const EMAIL = /^\S+@\S+\.\S+$/;

interface CreateUserDialogProps {
  onCreated: (user: User) => void;
  onClose: () => void;
}

export function CreateUserDialog({
  onCreated,
  onClose,
}: CreateUserDialogProps): JSX.Element {
  const t = useT();
  const formId = useId();
  const create = useCreateUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [generated, setGenerated] = useState(false);
  const [role, setRole] = useState<Role>('inspector');
  const [attempted, setAttempted] = useState(false);

  const trimmedName = name.trim();
  const normalisedEmail = email.trim().toLowerCase();

  const nameProblem =
    trimmedName.length < 1
      ? t.users.nameRequired
      : trimmedName.length > 200
        ? t.users.nameTooLong
        : null;
  const emailProblem = EMAIL.test(normalisedEmail)
    ? null
    : t.users.emailInvalid;
  const passwordProblem =
    password.length < 8 || password.length > 200
      ? t.users.passwordInvalid
      : null;

  const error = create.error;
  const serverFields = error?.status === 400 ? fieldErrors(error) : {};
  const emailTaken = error?.status === 409;
  const fieldsCovered =
    serverFields.name || serverFields.email || serverFields.password;

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setAttempted(true);
    if (nameProblem || emailProblem || passwordProblem) return;
    create.mutate(
      { name: trimmedName, email: normalisedEmail, password, role },
      { onSuccess: onCreated },
    );
  }

  return (
    <Dialog
      title={t.users.addTitle}
      onClose={create.isPending ? false : onClose}
      actions={
        <>
          <Button variant="text" disabled={create.isPending} onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form={formId} loading={create.isPending}>
            {t.users.create}
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
          type="email"
          inputMode="email"
          inputDir="ltr"
          required
          autoComplete="off"
          value={email}
          error={
            (attempted ? emailProblem : null) ??
            (emailTaken ? t.users.emailTaken : serverFields.email?.[0])
          }
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className={styles.password}>
          <TextField
            label={t.users.password}
            // Shown once generated: it has to be copied and passed on.
            type={generated ? 'text' : 'password'}
            inputDir="ltr"
            code={generated}
            required
            autoComplete="new-password"
            helperText={
              generated ? t.users.generatedHelp : t.users.passwordHelp
            }
            value={password}
            error={
              (attempted ? passwordProblem : null) ?? serverFields.password?.[0]
            }
            onChange={(e) => {
              setPassword(e.target.value);
              setGenerated(false);
            }}
          />
          <Button
            variant="text"
            startIcon="refresh"
            onClick={() => {
              setPassword(generatePassword());
              setGenerated(true);
            }}
          >
            {t.users.generate}
          </Button>
        </div>
        <Select
          label={t.users.role}
          required
          value={role}
          options={[
            { value: 'inspector', label: t.roles.inspector },
            { value: 'admin', label: t.roles.admin },
          ]}
          onChange={(e) => setRole(e.target.value as Role)}
        />
        {error && !emailTaken && !fieldsCovered && (
          <Alert variant="error">{errorMessage(error, t)}</Alert>
        )}
      </form>
    </Dialog>
  );
}
