import { useState, type JSX } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { AppBar } from '../../../components/AppBar';
import { BottomNav, type BottomNavItem } from '../../../components/BottomNav';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Icon } from '../../../components/Icon';
import { IconButton } from '../../../components/IconButton';
import { LanguageSwitch } from '../../../components/LanguageSwitch';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { SessionExpiryBanner } from '../../../components/SessionExpiryBanner';
import { SuspenseLoader } from '../../../components/SuspenseLoader';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useT } from '../../../hooks/useI18n';
import { useLogout } from '../../../hooks/useLogout';
import { useOutboxCount } from '../../../hooks/web/useOutbox';
import styles from './InspectorLayout.module.css';

/** Set when opening a record from a filtered list. */
export interface ListReturnState {
  listSearch?: string;
}

const SECTIONS = ['forms', 'outbox', 'sent'] as const;
type Section = (typeof SECTIONS)[number];

function currentSection(pathname: string): Section {
  return (
    SECTIONS.find((s) => pathname.startsWith(`/inspector/${s}`)) ?? 'forms'
  );
}

/**
 * The field app's frame: the bar always says which app this is and where, banners sit
 * directly under it, and the three destinations stay in thumb reach. Errors and loading
 * stay inside the content, so the way out is always on screen.
 */
export function InspectorLayout(): JSX.Element {
  const t = useT();
  const user = useCurrentUser();
  const logout = useLogout();
  const { pathname, state } = useLocation();
  const outboxCount = useOutboxCount(user.id);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const section = currentSection(pathname);
  const sectionPath = `/inspector/${section}`;
  const titles: Record<Section, string> = {
    forms: t.inspector.formsTitle,
    outbox: t.inspector.outboxTitle,
    sent: t.inspector.sentTitle,
  };
  const items: BottomNavItem[] = [
    {
      id: 'forms',
      icon: 'clipboard',
      label: t.inspector.forms,
      to: '/inspector/forms',
    },
    {
      id: 'outbox',
      icon: 'cloudUp',
      label: t.inspector.outbox,
      to: '/inspector/outbox',
      badge: outboxCount,
    },
    {
      id: 'sent',
      icon: 'cloudCheck',
      label: t.inspector.sent,
      to: '/inspector/sent',
    },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <AppBar
          title={titles[section]}
          subtitle={<span dir="auto">{user.name}</span>}
          start={
            pathname !== sectionPath && (
              <Link
                // Back to the list as it was left: same search, same page.
                to={
                  sectionPath +
                  ((state as ListReturnState | null)?.listSearch ?? '')
                }
                className={styles.back}
                aria-label={t.common.back}
                title={t.common.back}
              >
                <Icon name="arrowStart" />
              </Link>
            )
          }
          end={
            <>
              <LanguageSwitch />
              <IconButton
                icon="logout"
                variant="onbrand"
                label={t.common.logout}
                onClick={() =>
                  outboxCount > 0 ? setConfirmingLogout(true) : logout()
                }
              />
            </>
          }
        />
        <OfflineBanner />
        <SessionExpiryBanner />
      </div>
      <main className={styles.content}>
        <RouteErrorBoundary backTo={sectionPath} backLabel={titles[section]}>
          <SuspenseLoader layout="cards">
            <Outlet />
          </SuspenseLoader>
        </RouteErrorBoundary>
      </main>
      <div className={styles.bottom}>
        <BottomNav items={items} label={t.inspector.sectionsLabel} />
      </div>
      <ConfirmDialog
        title={t.outbox.logoutTitle(outboxCount)}
        variant="warning"
        sheet
        open={confirmingLogout}
        confirmLabel={t.common.logout}
        onConfirm={logout}
        onCancel={() => setConfirmingLogout(false)}
      >
        {t.outbox.logoutBody}
      </ConfirmDialog>
    </div>
  );
}
