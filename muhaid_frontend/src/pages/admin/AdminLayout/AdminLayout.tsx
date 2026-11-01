import { useEffect, useRef, useState, type JSX } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { AppBar } from '../../../components/AppBar';
import { IconButton } from '../../../components/IconButton';
import { LanguageSwitch } from '../../../components/LanguageSwitch';
import { RouteErrorBoundary } from '../../../components/RouteErrorBoundary';
import { SessionExpiryBanner } from '../../../components/SessionExpiryBanner';
import { SideNav, type SideNavItem } from '../../../components/SideNav';
import { SuspenseLoader } from '../../../components/SuspenseLoader';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useT } from '../../../hooks/useI18n';
import { useLogout } from '../../../hooks/useLogout';
import styles from './AdminLayout.module.css';

/**
 * The dashboard's frame: the four sections beside the page, or in a drawer over it below
 * the tablet breakpoint rather than a squeezed column. Errors and loading stay inside the
 * content, so the navigation is always there.
 */
export function AdminLayout(): JSX.Element {
  const t = useT();
  const user = useCurrentUser();
  const logout = useLogout();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const items: (SideNavItem & { id: keyof typeof t.admin.backTo })[] = [
    {
      id: 'inspections',
      icon: 'clipboard',
      label: t.admin.inspections,
      to: '/admin/inspections',
    },
    {
      id: 'projects',
      icon: 'folder',
      label: t.admin.projects,
      to: '/admin/projects',
    },
    {
      id: 'templates',
      icon: 'building',
      label: t.admin.templates,
      to: '/admin/templates',
    },
    { id: 'users', icon: 'user', label: t.admin.users, to: '/admin/users' },
  ];
  const section =
    items.find((item) => pathname.startsWith(item.to)) ?? items[0];

  // The drawer takes focus and Esc while open, and hands focus back when it closes.
  useEffect(() => {
    if (!drawerOpen) return;
    const menuButton = menuButtonRef.current;
    drawerRef.current?.querySelector('a')?.focus();
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      menuButton?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className={styles.root}>
      <SideNav items={items} className={styles.sideNav} />

      {drawerOpen && (
        <div className={styles.drawer}>
          <button
            type="button"
            className={styles.scrim}
            aria-label={t.admin.closeMenu}
            onClick={() => setDrawerOpen(false)}
          />
          <div ref={drawerRef} className={styles.drawerPanel}>
            <SideNav items={items} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className={styles.main} inert={drawerOpen}>
        <AppBar
          plain
          title={section.label}
          subtitle={<span dir="auto">{user.name}</span>}
          start={
            <IconButton
              ref={menuButtonRef}
              icon="more"
              label={t.admin.openMenu}
              className={styles.menuButton}
              onClick={() => setDrawerOpen(true)}
            />
          }
          end={
            <>
              <LanguageSwitch />
              <IconButton
                icon="logout"
                label={t.common.logout}
                onClick={logout}
              />
            </>
          }
        />
        <SessionExpiryBanner />
        <main className={styles.content}>
          <RouteErrorBoundary
            backTo={section.to}
            backLabel={t.admin.backTo[section.id]}
          >
            <SuspenseLoader layout="table">
              <Outlet />
            </SuspenseLoader>
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
