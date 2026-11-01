import { useId, useState, type FormEvent, type JSX } from 'react';

import {
  useCreateProject,
  useUpdateProject,
} from '../../hooks/admin/useProjects';
import { useT } from '../../hooks/useI18n';
import { fieldErrors, type ApiError } from '../../lib/apiError';
import { errorMessage } from '../../lib/errorMessage';
import type { Messages } from '../../lib/i18n/messages';
import type { Project, ProjectBody } from '../../types/admin/projects';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { TextField } from '../TextField';
import styles from './ProjectFormDialog.module.css';

const CODE = /^[A-Za-z0-9_-]+$/;

function codeProblem(code: string, t: Messages): string | null {
  if (code.length < 1) return t.projects.codeRequired;
  if (code.length > 50) return t.projects.codeTooLong;
  return CODE.test(code) ? null : t.projects.codeInvalid;
}

function nameProblem(name: string, t: Messages): string | null {
  if (name.length < 1) return t.projects.nameRequired;
  return name.length > 200 ? t.projects.nameTooLong : null;
}

interface FormProps {
  initial?: ProjectBody;
  title: string;
  submitLabel: string;
  submit: (body: ProjectBody) => void;
  isPending: boolean;
  error: ApiError | null;
  onClose: () => void;
}

function ProjectForm({
  initial,
  title,
  submitLabel,
  submit,
  isPending,
  error,
  onClose,
}: FormProps): JSX.Element {
  const t = useT();
  const formId = useId();
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [attempted, setAttempted] = useState(false);

  const trimmedCode = code.trim();
  const trimmedName = name.trim();
  const unchanged =
    initial !== undefined &&
    trimmedCode === initial.code &&
    trimmedName === initial.name;
  const codeChanged = initial !== undefined && trimmedCode !== initial.code;

  const serverFields = error?.status === 400 ? fieldErrors(error) : {};
  // The server's rule for the code's characters doesn't start with the field's name.
  const badCodeFromServer = error?.messages.some((m) =>
    m.startsWith('Use letters'),
  );
  const serverCodeError =
    error?.status === 409
      ? t.projects.codeTaken
      : badCodeFromServer
        ? t.projects.codeInvalid
        : serverFields.code?.[0];
  const serverNameError = serverFields.name?.[0];
  const codeError =
    (attempted ? codeProblem(trimmedCode, t) : null) ?? serverCodeError;
  const nameError =
    (attempted ? nameProblem(trimmedName, t) : null) ?? serverNameError;
  const generalError =
    error && !serverCodeError && !serverNameError
      ? errorMessage(error, t)
      : null;

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setAttempted(true);
    if (codeProblem(trimmedCode, t) || nameProblem(trimmedName, t)) return;
    submit({ code: trimmedCode, name: trimmedName });
  }

  return (
    <Dialog
      title={title}
      onClose={isPending ? false : onClose}
      actions={
        <>
          <Button variant="text" disabled={isPending} onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={isPending}
            disabled={unchanged}
          >
            {submitLabel}
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
          label={t.projects.code}
          code
          required
          autoComplete="off"
          placeholder="PRJ-2026-001"
          helperText={t.projects.codeHelp}
          value={code}
          error={codeError}
          onChange={(e) => setCode(e.target.value)}
        />
        <TextField
          label={t.projects.name}
          required
          autoComplete="off"
          value={name}
          error={nameError}
          onChange={(e) => setName(e.target.value)}
        />
        {codeChanged && (
          <Alert variant="info">{t.projects.codeChangeNote}</Alert>
        )}
        {generalError && <Alert variant="error">{generalError}</Alert>}
      </form>
    </Dialog>
  );
}

interface CreateProjectDialogProps {
  onCreated: (project: Project) => void;
  onClose: () => void;
}

export function CreateProjectDialog({
  onCreated,
  onClose,
}: CreateProjectDialogProps): JSX.Element {
  const t = useT();
  const create = useCreateProject();
  return (
    <ProjectForm
      title={t.projects.addTitle}
      submitLabel={t.projects.create}
      isPending={create.isPending}
      error={create.error}
      submit={(body) => create.mutate(body, { onSuccess: onCreated })}
      onClose={onClose}
    />
  );
}

interface EditProjectDialogProps {
  project: Project;
  onSaved: () => void;
  onClose: () => void;
}

export function EditProjectDialog({
  project,
  onSaved,
  onClose,
}: EditProjectDialogProps): JSX.Element {
  const t = useT();
  const update = useUpdateProject(project.id);
  return (
    <ProjectForm
      initial={{ code: project.code, name: project.name }}
      title={t.projects.editTitle}
      submitLabel={t.common.save}
      isPending={update.isPending}
      error={update.error}
      submit={({ code, name }) =>
        // Only what changed.
        update.mutate(
          {
            ...(code !== project.code ? { code } : {}),
            ...(name !== project.name ? { name } : {}),
          },
          { onSuccess: onSaved },
        )
      }
      onClose={onClose}
    />
  );
}
