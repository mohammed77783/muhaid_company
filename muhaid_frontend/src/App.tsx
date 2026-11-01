import { useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, type JSX, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';

import { RequireAuth } from './components/RequireAuth';
import { RequireRole } from './components/RequireRole';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { Skeleton } from './components/Skeleton';
import { SnackbarProvider } from './components/Snackbar';
import { SuspenseLoader } from './components/SuspenseLoader';
import { useCurrentUser } from './hooks/useCurrentUser';
import { AUTH_LOGOUT_EVENT } from './lib/apiClient';
import { LanguageProvider } from './lib/i18n/LanguageProvider';
import { PERSIST_MAX_AGE, queryClient } from './lib/queryClient';
import { queryPersister, shouldPersistQuery } from './lib/queryPersister';
import { homePath } from './lib/routes';
import { AdminLayout } from './pages/admin/AdminLayout';
import { InspectionDetail as AdminInspectionDetail } from './pages/admin/InspectionDetail';
import { Inspections as AdminInspections } from './pages/admin/Inspections';
import { ProjectDetail } from './pages/admin/ProjectDetail';
import { Projects } from './pages/admin/Projects';
import { TemplateDetail } from './pages/admin/TemplateDetail';
import { EditTemplate, NewTemplate } from './pages/admin/TemplateEditor';
import { Templates } from './pages/admin/Templates';
import { UserDetail } from './pages/admin/UserDetail';
import { Users } from './pages/admin/Users';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { EditOutboxEntry } from './pages/web/EditOutboxEntry';
import { FillForm } from './pages/web/FillForm';
import { FormPicker } from './pages/web/FormPicker';
import { InspectionDetail } from './pages/web/InspectionDetail';
import { InspectorLayout } from './pages/web/InspectorLayout';
import { InspectorRoot } from './pages/web/InspectorRoot';
import { MyInspections } from './pages/web/MyInspections';
import { Outbox } from './pages/web/Outbox';

/**
 * Holds the app back until the persisted cache is restored. A suspense query doesn't wait
 * for the restore: with no signal, it would fail before the saved data came back.
 */
function RestoreGate({ children }: { children: ReactNode }): JSX.Element {
  const isRestoring = useIsRestoring();
  return isRestoring ? <Skeleton lines={4} /> : <>{children}</>;
}

/** The server ended the session: the client has cleared the token, so go and log in. */
function SessionEndedListener(): null {
  const navigate = useNavigate();
  useEffect(() => {
    function handleLogout(): void {
      const { pathname, search } = window.location;
      void navigate('/login', {
        replace: true,
        state: { from: pathname + search, sessionEnded: true },
      });
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
  }, [navigate]);
  return null;
}

function HomeRedirect(): JSX.Element {
  const user = useCurrentUser();
  return <Navigate to={homePath(user.role)} replace />;
}

function AppRoutes(): JSX.Element {
  return (
    <>
      <SessionEndedListener />
      <RouteErrorBoundary>
        <SuspenseLoader>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route element={<RequireRole role="inspector" />}>
                <Route path="/inspector" element={<InspectorRoot />}>
                  <Route path="forms/:templateId/new" element={<FillForm />} />
                  <Route
                    path="outbox/:entryId/edit"
                    element={<EditOutboxEntry />}
                  />
                  <Route element={<InspectorLayout />}>
                    <Route index element={<Navigate to="forms" replace />} />
                    <Route path="forms" element={<FormPicker />} />
                    <Route path="outbox" element={<Outbox />} />
                    <Route path="sent" element={<MyInspections />} />
                    <Route path="sent/:id" element={<InspectionDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Route>
              <Route element={<RequireRole role="admin" />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route
                    index
                    element={<Navigate to="inspections" replace />}
                  />
                  <Route path="inspections" element={<AdminInspections />} />
                  <Route
                    path="inspections/:id"
                    element={<AdminInspectionDetail />}
                  />
                  <Route path="templates" element={<Templates />} />
                  <Route path="templates/new" element={<NewTemplate />} />
                  <Route path="templates/:id" element={<TemplateDetail />} />
                  <Route path="templates/:id/edit" element={<EditTemplate />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectDetail />} />
                  <Route path="users" element={<Users />} />
                  <Route path="users/:id" element={<UserDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SuspenseLoader>
      </RouteErrorBoundary>
    </>
  );
}

function App(): JSX.Element {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: PERSIST_MAX_AGE,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      <LanguageProvider>
        <SnackbarProvider>
          <BrowserRouter>
            <RestoreGate>
              <AppRoutes />
            </RestoreGate>
          </BrowserRouter>
        </SnackbarProvider>
      </LanguageProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
