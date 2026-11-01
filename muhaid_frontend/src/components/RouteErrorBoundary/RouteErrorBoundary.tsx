import { QueryErrorResetBoundary } from '@tanstack/react-query';
import type { JSX, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation, useNavigate, type To } from 'react-router-dom';

import { useT } from '../../hooks/useI18n';
import { toApiError } from '../../lib/apiError';
import { Button } from '../Button';
import { EmptyState } from '../EmptyState';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  /** The list this page probably came from, rather than a back button. */
  backTo?: To;
  backLabel?: string;
  notFoundTitle?: string;
  notFoundBody?: string;
  /** What to say with no connection, when the page has its own way forward. */
  networkBody?: string;
}

interface RouteErrorFallbackProps extends Omit<
  RouteErrorBoundaryProps,
  'children'
> {
  error: unknown;
  onRetry: () => void;
}

function RouteErrorFallback({
  error,
  onRetry,
  backTo = '/',
  backLabel,
  notFoundTitle,
  notFoundBody,
  networkBody,
}: RouteErrorFallbackProps): JSX.Element | null {
  const t = useT();
  const navigate = useNavigate();
  const apiError = toApiError(error);

  // The client has already cleared the token and is on its way to the login page.
  if (apiError.status === 401) return null;

  const back = (
    <Button variant="secondary" onClick={() => void navigate(backTo)}>
      {backLabel ?? t.errors.goHome}
    </Button>
  );

  // A malformed id in the URL (400) and a missing record (404) mean the same to a person.
  if (apiError.status === 404 || apiError.status === 400) {
    return (
      <EmptyState
        icon="search"
        title={notFoundTitle ?? t.errors.notFoundTitle}
        body={notFoundBody ?? t.errors.notFoundBody}
        action={back}
      />
    );
  }

  const body = apiError.isNetworkError
    ? (networkBody ?? t.errors.network)
    : apiError.status === 403
      ? t.errors.forbidden
      : apiError.status >= 500
        ? t.errors.server
        : (apiError.messages[0] ?? t.errors.unexpected);

  return (
    <EmptyState
      icon="alert"
      title={t.errors.loadFailedTitle}
      body={body}
      action={
        <Button startIcon="refresh" onClick={onRetry}>
          {t.common.retry}
        </Button>
      }
    />
  );
}

/** Catches a failed read at the route level. Moving to another page clears the error. */
export function RouteErrorBoundary({
  children,
  ...fallback
}: RouteErrorBoundaryProps): JSX.Element {
  const { pathname } = useLocation();
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          resetKeys={[pathname]}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <RouteErrorFallback
              {...fallback}
              error={error}
              onRetry={resetErrorBoundary}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
