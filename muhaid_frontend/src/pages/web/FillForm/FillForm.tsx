import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type JSX } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { templatesKeys } from '../../../api/web/templatesApi';
import { Alert } from '../../../components/Alert';
import { AppBar } from '../../../components/AppBar';
import { Button } from '../../../components/Button';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EmptyState } from '../../../components/EmptyState';
import { IconButton } from '../../../components/IconButton';
import { InspectionForm } from '../../../components/InspectionForm';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { SessionExpiryBanner } from '../../../components/SessionExpiryBanner';
import { Skeleton } from '../../../components/Skeleton';
import { SuspenseLoader } from '../../../components/SuspenseLoader';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useT } from '../../../hooks/useI18n';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useUnsavedWarning } from '../../../hooks/useUnsavedWarning';
import { useMyTemplate } from '../../../hooks/web/useMyTemplate';
import { useOutboxEntry } from '../../../hooks/web/useOutbox';
import { useSaveInspection } from '../../../hooks/web/useSaveInspection';
import { isValidOn, utcCalendarDate } from '../../../lib/dates';
import type { DraftInput } from '../../../types/web/inspections';
import styles from './FillForm.module.css';

const FORMS_PATH = '/inspector/forms';

export interface FillFormLocationState {
  /** A refused entry being filled again: keeps its work order and photo, then replaces it. */
  refillEntryId?: string;
}

function FillFormContent({ templateId }: { templateId: string }): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const { template, removed } = useMyTemplate(templateId);
  const save = useSaveInspection();
  const user = useCurrentUser();
  const location = useLocation();
  const { refillEntryId } = (location.state ?? {}) as FillFormLocationState;
  const refilling = useOutboxEntry(user.id, refillEntryId);
  const [dirty, setDirty] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  // No longer assigned: the cached list must stop offering it.
  useEffect(() => {
    if (removed) {
      void queryClient.invalidateQueries({ queryKey: templatesKeys.list() });
    }
  }, [removed, queryClient]);

  useUnsavedWarning(dirty);

  function leave(): void {
    void navigate(FORMS_PATH);
  }

  async function handleSave(draft: DraftInput): Promise<void> {
    try {
      await save(draft, template, refilling?.id);
    } catch {
      snackbar.show({ message: t.fillForm.saveFailed, variant: 'error' });
      return;
    }
    setDirty(false);
    snackbar.show({ message: t.fillForm.saved, variant: 'success' });
    void navigate('/inspector/outbox');
  }

  const bar = (
    <div className={styles.top}>
      <AppBar
        title={template.name}
        subtitle={
          <>
            <span className="code">{template.project.code}</span>
            {' — '}
            <span dir="auto">{template.project.name}</span>
          </>
        }
        start={
          <IconButton
            icon="arrowStart"
            variant="onbrand"
            label={t.common.back}
            onClick={() => (dirty ? setConfirmingLeave(true) : leave())}
          />
        }
      />
      <OfflineBanner />
      <SessionExpiryBanner />
    </div>
  );

  // The server would refuse either: 404 on the template, 422 on the dates.
  if (removed || !isValidOn(template, utcCalendarDate())) {
    return (
      <>
        {bar}
        <EmptyState
          icon="lock"
          title={
            removed ? t.fillForm.unavailableTitle : t.fillForm.outOfDateTitle
          }
          body={removed ? t.fillForm.unavailableBody : t.fillForm.outOfDateBody}
          action={
            <Button variant="secondary" onClick={leave}>
              {t.fillForm.backToForms}
            </Button>
          }
        />
      </>
    );
  }

  // Still reading the entry: the form takes its starting values only once.
  if (refillEntryId && refilling === undefined) {
    return (
      <>
        {bar}
        <div className={styles.loading}>
          <Skeleton lines={6} />
        </div>
      </>
    );
  }

  return (
    <>
      {bar}
      {refilling && <Alert variant="info">{t.outbox.refillNotice}</Alert>}
      <InspectionForm
        key={refilling?.id}
        workOrderNumber={template.workOrderNumber}
        initial={
          refilling
            ? {
                answers: {},
                photo: { blob: refilling.photo, name: 'photo' },
              }
            : undefined
        }
        items={template.items}
        onSave={handleSave}
        onDirtyChange={setDirty}
      />
      <ConfirmDialog
        title={t.fillForm.leaveTitle}
        variant="warning"
        sheet
        open={confirmingLeave}
        confirmLabel={t.fillForm.leaveConfirm}
        cancelLabel={t.fillForm.keepFilling}
        onConfirm={leave}
        onCancel={() => setConfirmingLeave(false)}
      >
        {t.fillForm.leaveBody}
      </ConfirmDialog>
    </>
  );
}

/** Its own screen, without the bottom nav: the save bar is the only commitment here. */
export function FillForm(): JSX.Element {
  const t = useT();
  const { templateId = '' } = useParams();
  return (
    <div className={styles.root}>
      <RouteErrorBoundary
        backTo={FORMS_PATH}
        backLabel={t.fillForm.backToForms}
        notFoundTitle={t.fillForm.unavailableTitle}
        notFoundBody={t.fillForm.unavailableBody}
        networkBody={t.forms.downloadFirst}
      >
        <SuspenseLoader
          fallback={
            <>
              <AppBar title={t.fillForm.loadingTitle} />
              <div className={styles.loading}>
                <Skeleton lines={6} />
              </div>
            </>
          }
        >
          <FillFormContent key={templateId} templateId={templateId} />
        </SuspenseLoader>
      </RouteErrorBoundary>
    </div>
  );
}
