import { useState, type FormEvent, type JSX, type ReactNode } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Checkbox } from '../../../components/Checkbox';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { DatePicker } from '../../../components/DatePicker';
import { Fact, Facts } from '../../../components/Facts';
import {
  ItemsEditor,
  MAX_ITEM_LENGTH,
  newRow,
  type ItemRow,
} from '../../../components/ItemsEditor';
import { PageHeader } from '../../../components/PageHeader';
import { ProjectSelect } from '../../../components/ProjectSelect';
import { QuestionRow } from '../../../components/QuestionRow';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { TextField } from '../../../components/TextField';
import {
  useCreateTemplate,
  useReplaceTemplate,
  useTemplate,
  useUpdateTemplate,
  type ReplaceStep,
} from '../../../hooks/admin/useTemplates';
import { useT } from '../../../hooks/useI18n';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useUnsavedWarning } from '../../../hooks/useUnsavedWarning';
import { fieldErrors, type ApiError } from '../../../lib/apiError';
import { isCalendarDate, todayCalendarDate } from '../../../lib/dates';
import { errorMessage } from '../../../lib/errorMessage';
import { isUuid } from '../../../lib/isUuid';
import type {
  TemplateDetail,
  UpdateTemplateBody,
} from '../../../types/admin/templates';
import type { CalendarDate, TemplateItem } from '../../../types/api';
import styles from './TemplateEditor.module.css';

const LIST_PATH = '/admin/templates';

export interface NewTemplateLocationState {
  /** The template to start from. */
  sourceId?: string;
  /** Also swap the source for this one: assign its inspectors and end it. */
  replace?: boolean;
}

export interface TemplateFormValues {
  projectId: string;
  name: string;
  validFrom: CalendarDate;
  validTo: CalendarDate | null;
  items: string[];
}

interface TemplateFormProps {
  initial: TemplateFormValues;
  /** Shown read-only: the project can't change after creation. */
  fixedProject?: ReactNode;
  /** Questions that can no longer be replaced. */
  lockedItems?: TemplateItem[];
  /** The start date must come after this. */
  startsAfter?: CalendarDate;
  /** Edit only: Save stays off until something differs. */
  disableWhenUnchanged?: boolean;
  submitLabel: string;
  isPending: boolean;
  error: ApiError | null;
  notice?: ReactNode;
  onSubmit: (values: TemplateFormValues) => void;
  onCancel: () => void;
}

function TemplateForm({
  initial,
  fixedProject,
  lockedItems,
  startsAfter,
  disableWhenUnchanged = false,
  submitLabel,
  isPending,
  error,
  notice,
  onSubmit,
  onCancel,
}: TemplateFormProps): JSX.Element {
  const t = useT();
  const [projectId, setProjectId] = useState(initial.projectId);
  const [name, setName] = useState(initial.name);
  const [validFrom, setValidFrom] = useState(initial.validFrom);
  const [validTo, setValidTo] = useState(initial.validTo ?? '');
  const [noEndDate, setNoEndDate] = useState(initial.validTo === null);
  const [rows, setRows] = useState<ItemRow[]>(() =>
    initial.items.length > 0
      ? initial.items.map((text) => newRow(text))
      : [newRow()],
  );
  const [attempted, setAttempted] = useState(false);

  const trimmedName = name.trim();
  const items = rows.map((row) => row.text.trim());
  const values: TemplateFormValues = {
    projectId,
    name: trimmedName,
    validFrom,
    validTo: noEndDate ? null : validTo,
    items,
  };

  const unchanged =
    trimmedName === initial.name &&
    validFrom === initial.validFrom &&
    values.validTo === initial.validTo &&
    (lockedItems !== undefined ||
      JSON.stringify(items) === JSON.stringify(initial.items));
  useUnsavedWarning(!unchanged && !isPending);

  // Client rules first: the server reports bad questions without a row number.
  const projectProblem =
    !fixedProject && !projectId ? t.templates.projectRequired : null;
  const nameProblem =
    trimmedName.length < 1
      ? t.templates.nameRequired
      : trimmedName.length > 200
        ? t.templates.nameTooLong
        : null;
  const validFromProblem = !isCalendarDate(validFrom)
    ? t.templates.validFromRequired
    : startsAfter && validFrom <= startsAfter
      ? t.templates.replaceValidFrom
      : null;
  const validToProblem = noEndDate
    ? null
    : !isCalendarDate(validTo)
      ? t.templates.validToRequired
      : validFrom && validTo < validFrom
        ? t.templates.validToOrder
        : null;
  const rowProblems: Record<string, string> = {};
  if (!lockedItems) {
    for (const row of rows) {
      const text = row.text.trim();
      if (!text) rowProblems[row.key] = t.templates.questionRequired;
      else if (text.length > MAX_ITEM_LENGTH) {
        rowProblems[row.key] = t.templates.questionTooLong;
      }
    }
  }
  const hasProblem = Boolean(
    projectProblem ||
    nameProblem ||
    validFromProblem ||
    validToProblem ||
    Object.keys(rowProblems).length > 0,
  );

  // What the server said, on the field it concerns.
  const server = error?.status === 400 ? fieldErrors(error) : {};
  const serverDateOrder = error?.messages.some(
    (m) =>
      m.startsWith('validTo must be on or after') ||
      m.startsWith('Constraint failed: template_dates_chk'),
  );
  const serverItems = server.items?.join(' · ');
  const covered =
    server.name || server.validFrom || server.validTo || server.projectId;
  const generalError =
    error &&
    !covered &&
    !serverDateOrder &&
    !serverItems &&
    error.status !== 409
      ? errorMessage(error, t)
      : null;

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setAttempted(true);
    if (hasProblem || isPending) return;
    onSubmit(values);
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      {notice}

      {fixedProject ?? (
        <ProjectSelect
          required
          value={projectId}
          error={(attempted ? projectProblem : null) ?? server.projectId?.[0]}
          onChange={setProjectId}
        />
      )}

      <TextField
        label={t.templates.name}
        required
        autoComplete="off"
        value={name}
        error={(attempted ? nameProblem : null) ?? server.name?.[0]}
        onChange={(e) => setName(e.target.value)}
      />

      <div className={styles.dates}>
        <DatePicker
          label={t.templates.validFrom}
          required
          value={validFrom}
          error={(attempted ? validFromProblem : null) ?? server.validFrom?.[0]}
          onChange={(e) => setValidFrom(e.target.value)}
        />
        <div className={styles.validTo}>
          <DatePicker
            label={t.templates.validTo}
            required={!noEndDate}
            disabled={noEndDate}
            min={validFrom || undefined}
            value={noEndDate ? '' : validTo}
            error={
              (attempted ? validToProblem : null) ??
              (serverDateOrder ? t.templates.validToOrder : server.validTo?.[0])
            }
            onChange={(e) => setValidTo(e.target.value)}
          />
          <Checkbox
            label={t.templates.noEndDate}
            checked={noEndDate}
            onChange={() => setNoEndDate((on) => !on)}
          />
        </div>
      </div>

      <section className={styles.questions}>
        <h2 className={styles.heading}>{t.templates.questions}</h2>
        {serverItems && <Alert variant="error">{serverItems}</Alert>}
        {lockedItems ? (
          <>
            {lockedItems.map((item) => (
              <QuestionRow
                key={item.id}
                index={item.position}
                text={item.label}
                locked
              />
            ))}
          </>
        ) : (
          <ItemsEditor
            rows={rows}
            onChange={setRows}
            errors={attempted ? rowProblems : {}}
          />
        )}
      </section>

      {generalError && <Alert variant="error">{generalError}</Alert>}

      <div className={styles.actions}>
        <Button variant="text" disabled={isPending} onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button
          type="submit"
          loading={isPending}
          disabled={disableWhenUnchanged && unchanged}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

const EMPTY_VALUES: TemplateFormValues = {
  projectId: '',
  name: '',
  validFrom: '',
  validTo: null,
  items: [],
};

function valuesFromSource(source: TemplateDetail): TemplateFormValues {
  return {
    projectId: source.project.id,
    name: source.name,
    validFrom: todayCalendarDate(),
    validTo: null,
    items: source.items.map((item) => item.label),
  };
}

function ReplaceSteps({
  steps,
}: {
  steps: Record<ReplaceStep, 'waiting' | 'done' | 'failed'>;
}): JSX.Element {
  const t = useT();
  const words = {
    waiting: t.templates.stepWaiting,
    done: t.templates.stepDone,
    failed: t.templates.stepFailed,
  };
  const rows: [ReplaceStep, string][] = [
    ['create', t.templates.stepCreate],
    ['assign', t.templates.stepAssign],
    ['endOld', t.templates.stepEndOld],
  ];
  return (
    <ol className={styles.steps}>
      {rows.map(([step, label]) => (
        <li key={step}>
          {label}: <strong>{words[steps[step]]}</strong>
        </li>
      ))}
    </ol>
  );
}

function ReplaceForm({ source }: { source: TemplateDetail }): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { steps, error, isRunning, run } = useReplaceTemplate(source);
  const started = steps.create !== 'waiting';

  async function handleSubmit(values: TemplateFormValues): Promise<void> {
    const template = await run(values);
    if (template) {
      snackbar.show({ message: t.templates.replaced, variant: 'success' });
      void navigate(`${LIST_PATH}/${template.id}`, { replace: true });
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t.admin.templates, to: LIST_PATH },
          { label: source.name, to: `${LIST_PATH}/${source.id}` },
          { label: t.templates.replaceTitle },
        ]}
        title={t.templates.replaceTitle}
      />
      <TemplateForm
        initial={valuesFromSource(source)}
        fixedProject={<SourceProject source={source} />}
        startsAfter={source.validFrom}
        submitLabel={
          started ? t.templates.replaceContinue : t.templates.replaceSubmit
        }
        isPending={isRunning}
        // Before the first step this is an ordinary create error on the form's fields.
        error={started ? null : error}
        notice={
          <>
            <Alert variant="info">{t.templates.replaceNote}</Alert>
            {started && <ReplaceSteps steps={steps} />}
            {started && error && (
              <Alert variant="error">
                {t.templates.replaceFailed} {errorMessage(error, t)}
              </Alert>
            )}
          </>
        }
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => void navigate(`${LIST_PATH}/${source.id}`)}
      />
    </>
  );
}

function SourceProject({ source }: { source: TemplateDetail }): JSX.Element {
  const t = useT();
  return (
    <Facts>
      <Fact label={t.templates.project}>
        <span className="code">{source.project.code}</span>
        {' — '}
        <span dir="auto">{source.project.name}</span>
      </Fact>
    </Facts>
  );
}

function CreateForm({ initial }: { initial: TemplateFormValues }): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const create = useCreateTemplate();
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t.admin.templates, to: LIST_PATH },
          { label: t.templates.createTitle },
        ]}
        title={t.templates.createTitle}
      />
      <TemplateForm
        initial={initial}
        submitLabel={t.templates.create}
        isPending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (template) => {
              snackbar.show({
                message: t.templates.created,
                variant: 'success',
              });
              void navigate(`${LIST_PATH}/${template.id}`, {
                replace: true,
                state: { justCreated: true },
              });
            },
            onError: (error) => {
              if (error.status === 404) {
                snackbar.show({
                  message: errorMessage(error, t),
                  variant: 'error',
                });
              }
            },
          })
        }
        onCancel={() => void navigate(LIST_PATH)}
      />
    </>
  );
}

function FromSource({
  sourceId,
  replace,
}: {
  sourceId: string;
  replace: boolean;
}): JSX.Element {
  const source = useTemplate(sourceId);
  return replace ? (
    <ReplaceForm source={source} />
  ) : (
    <CreateForm initial={valuesFromSource(source)} />
  );
}

/** A blank template, or a copy of one when opened with a source. */
export function NewTemplate(): JSX.Element {
  const t = useT();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const { sourceId, replace = false } = (state ??
    {}) as NewTemplateLocationState;
  const projectId = searchParams.get('projectId');
  return (
    <RouteErrorBoundary
      backTo={LIST_PATH}
      backLabel={t.admin.backTo.templates}
      notFoundTitle={t.templates.notFoundTitle}
      notFoundBody={t.templates.notFoundBody}
    >
      <div className={styles.root}>
        {sourceId ? (
          <FromSource sourceId={sourceId} replace={replace} />
        ) : (
          <CreateForm
            initial={{
              ...EMPTY_VALUES,
              projectId: isUuid(projectId) ? projectId : '',
            }}
          />
        )}
      </div>
    </RouteErrorBoundary>
  );
}

function EditForm({ id }: { id: string }): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const template = useTemplate(id);
  const update = useUpdateTemplate(id);
  const [pendingBody, setPendingBody] = useState<UpdateTemplateBody | null>(
    null,
  );
  const [risks, setRisks] = useState<string[]>([]);

  const locked = template.inspectionCount > 0;
  const detailPath = `${LIST_PATH}/${id}`;
  const initial: TemplateFormValues = {
    projectId: template.project.id,
    name: template.name,
    validFrom: template.validFrom,
    validTo: template.validTo,
    items: template.items.map((item) => item.label),
  };

  function send(body: UpdateTemplateBody): void {
    update.mutate(body, {
      onSuccess: () => {
        snackbar.show({ message: t.templates.updated, variant: 'success' });
        void navigate(detailPath);
      },
      onError: (error) => {
        if (error.status === 404) {
          snackbar.show({ message: errorMessage(error, t), variant: 'error' });
          void navigate(LIST_PATH);
        }
      },
    });
  }

  function handleSubmit(values: TemplateFormValues): void {
    // Only what changed. Sending unchanged items would still give every question a new id.
    const itemsChanged =
      !locked && JSON.stringify(values.items) !== JSON.stringify(initial.items);
    const datesChanged =
      values.validFrom !== template.validFrom ||
      values.validTo !== template.validTo;
    const body: UpdateTemplateBody = {
      ...(values.name !== template.name ? { name: values.name } : {}),
      // Both together, so a conflict gets the server's friendlier message.
      ...(datesChanged
        ? { validFrom: values.validFrom, validTo: values.validTo }
        : {}),
      ...(itemsChanged ? { items: values.items } : {}),
    };

    const found: string[] = [];
    if (itemsChanged && template.assignees.length > 0) {
      found.push(t.templates.riskQuestions);
    }
    const startsLater = values.validFrom > template.validFrom;
    const endsSooner =
      values.validTo !== null &&
      (template.validTo === null || values.validTo < template.validTo);
    if (startsLater || endsSooner) found.push(t.templates.riskDates);

    if (found.length > 0) {
      setRisks(found);
      setPendingBody(body);
    } else {
      send(body);
    }
  }

  const raced = update.error?.status === 409;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t.admin.templates, to: LIST_PATH },
          { label: template.name, to: detailPath },
          { label: t.templates.editTitle },
        ]}
        title={t.templates.editTitle}
      />
      <TemplateForm
        initial={initial}
        fixedProject={<SourceProject source={template} />}
        lockedItems={locked ? template.items : undefined}
        disableWhenUnchanged
        submitLabel={t.common.save}
        isPending={update.isPending}
        error={update.error}
        notice={
          <>
            {raced && <Alert variant="error">{t.templates.lockedRace}</Alert>}
            {locked && (
              <Alert
                variant="info"
                icon="lock"
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const state: NewTemplateLocationState = {
                        sourceId: id,
                        replace: false,
                      };
                      void navigate(`${LIST_PATH}/new`, { state });
                    }}
                  >
                    {t.templates.duplicate}
                  </Button>
                }
              >
                {t.templates.lockedBanner(template.inspectionCount)}
              </Alert>
            )}
          </>
        }
        onSubmit={handleSubmit}
        onCancel={() => void navigate(detailPath)}
      />
      <ConfirmDialog
        open={pendingBody !== null}
        variant="warning"
        title={t.templates.riskTitle}
        confirmLabel={t.templates.riskConfirm}
        onConfirm={() => {
          if (pendingBody) send(pendingBody);
          setPendingBody(null);
        }}
        onCancel={() => setPendingBody(null)}
      >
        {risks.map((risk) => (
          <p key={risk}>{risk}</p>
        ))}
      </ConfirmDialog>
    </>
  );
}

export function EditTemplate(): JSX.Element {
  const t = useT();
  const { id = '' } = useParams();
  return (
    <RouteErrorBoundary
      backTo={LIST_PATH}
      backLabel={t.admin.backTo.templates}
      notFoundTitle={t.templates.notFoundTitle}
      notFoundBody={t.templates.notFoundBody}
    >
      <div className={styles.root}>
        <EditForm key={id} id={id} />
      </div>
    </RouteErrorBoundary>
  );
}
