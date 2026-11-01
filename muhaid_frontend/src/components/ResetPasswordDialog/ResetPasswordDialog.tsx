import { useId, useState, type FormEvent, type JSX } from 'react';

import { useUpdateUser } from '../../hooks/admin/useUsers';
import { useT } from '../../hooks/useI18n';
import { fieldErrors } from '../../lib/apiError';
import { errorMessage } from '../../lib/errorMessage';
import { generatePassword } from '../../lib/password';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { TextField } from '../TextField';
import styles from './ResetPasswordDialog.module.css';

interface ResetPasswordDialogProps {
  userId: string;
  onSaved: () => void;
  onClose: () => void;
}

export function ResetPasswordDialog({
  userId,
  onSaved,
  onClose,
}: ResetPasswordDialogProps): JSX.Element {
  const t = useT();
  const formId = useId();
  const update = useUpdateUser(userId);
  const [password, setPassword] = useState('');
  const [generated, setGenerated] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const problem =
    password.length < 8 || password.length > 200
      ? t.users.passwordInvalid
      : null;
  const error = update.error;
  const serverField =
    error?.status === 400 ? fieldErrors(error).password?.[0] : undefined;

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setAttempted(true);
    if (problem) return;
    update.mutate({ password }, { onSuccess: onSaved });
  }

  return (
    <Dialog
      title={t.users.resetTitle}
      onClose={update.isPending ? false : onClose}
      actions={
        <>
          <Button variant="text" disabled={update.isPending} onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form={formId} loading={update.isPending}>
            {t.users.resetSave}
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
          label={t.users.password}
          type={generated ? 'text' : 'password'}
          inputDir="ltr"
          code={generated}
          required
          autoComplete="new-password"
          helperText={generated ? t.users.generatedHelp : t.users.passwordHelp}
          value={password}
          error={(attempted ? problem : null) ?? serverField}
          onChange={(e) => {
            setPassword(e.target.value);
            setGenerated(false);
          }}
        />
        <Button
          variant="text"
          startIcon="refresh"
          className={styles.generate}
          onClick={() => {
            setPassword(generatePassword());
            setGenerated(true);
          }}
        >
          {t.users.generate}
        </Button>
        {error && !serverField && (
          <Alert variant="error">{errorMessage(error, t)}</Alert>
        )}
      </form>
    </Dialog>
  );
}
