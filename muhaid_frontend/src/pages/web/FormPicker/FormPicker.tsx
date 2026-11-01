import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { FormCard } from '../../../components/FormCard';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useLang, useT } from '../../../hooks/useI18n';
import { useSnackbar } from '../../../hooks/useSnackbar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useOutboxTemplateIds } from '../../../hooks/web/useOutbox';
import { useMyTemplates } from '../../../hooks/web/useMyTemplates';
import {
  formatRelativeTime,
  isValidOn,
  utcCalendarDate,
} from '../../../lib/dates';
import type { ProjectRef } from '../../../types/api';
import type { WebTemplate } from '../../../types/web/templates';
import styles from './FormPicker.module.css';

interface ProjectGroup {
  project: ProjectRef;
  templates: WebTemplate[];
}

/** Keeps the server's order: sorted by project code, then template name. */
function groupByProject(templates: WebTemplate[]): ProjectGroup[] {
  const groups = new Map<string, ProjectGroup>();
  for (const template of templates) {
    const group = groups.get(template.project.id);
    if (group) group.templates.push(template);
    else {
      groups.set(template.project.id, {
        project: template.project,
        templates: [template],
      });
    }
  }
  return [...groups.values()];
}

function FormList(): JSX.Element {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const user = useCurrentUser();
  const waiting = useOutboxTemplateIds(user.id);
  const { templates, updatedAt, isRefreshing, refresh } = useMyTemplates();

  // The server picked "valid today" when it sent the list. A cached copy can go past its
  // dates while the device is offline, and the server would then reject those forms.
  const today = utcCalendarDate();
  // A work order is a one-time job: once saved on this device it is done, even unsent.
  const valid = templates.filter(
    (template) => isValidOn(template, today) && !waiting.has(template.id),
  );

  async function handleRefresh(): Promise<void> {
    const error = await refresh();
    // 401 goes to the login page and 403 re-checks the role: both explain themselves.
    if (error && error.status !== 401 && error.status !== 403) {
      snackbar.show({
        message: t.forms.refreshFailed,
        variant: 'error',
        actionLabel: t.common.retry,
        onAction: () => void handleRefresh(),
      });
    }
  }

  return (
    <>
      <div className={styles.freshness}>
        <span>{t.forms.lastUpdated(formatRelativeTime(updatedAt, lang))}</span>
        <Button
          variant="text"
          startIcon="refresh"
          loading={isRefreshing}
          onClick={() => void handleRefresh()}
        >
          {t.common.refresh}
        </Button>
      </div>

      {valid.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title={
            templates.length > 0 ? t.forms.expiredTitle : t.forms.emptyTitle
          }
          body={templates.length > 0 ? t.forms.expiredBody : t.forms.emptyBody}
        />
      ) : (
        groupByProject(valid).map(({ project, templates: group }) => (
          <section key={project.id} className={styles.group}>
            <h2 className={styles.groupHead}>
              <span className="code">{project.code}</span>
              <span dir="auto">{project.name}</span>
            </h2>
            <div className={styles.cards}>
              {group.map((template) => (
                <FormCard
                  key={template.id}
                  title={template.name}
                  projectCode={project.code}
                  workOrderNumber={template.workOrderNumber}
                  questionCount={template.items.length}
                  onClick={() =>
                    void navigate(`/inspector/forms/${template.id}/new`)
                  }
                />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}

/** The inspector's home: what is there to fill in on this site today. */
export function FormPicker(): JSX.Element {
  const t = useT();
  return (
    <RouteErrorBoundary networkBody={t.forms.downloadFirst}>
      <FormList />
    </RouteErrorBoundary>
  );
}
