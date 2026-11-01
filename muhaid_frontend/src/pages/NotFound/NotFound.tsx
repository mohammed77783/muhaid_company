import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useT } from '../../hooks/useI18n';

/** A bad link: offers the way home rather than a back button. */
export function NotFound(): JSX.Element {
  const t = useT();
  const navigate = useNavigate();
  return (
    <EmptyState
      icon="search"
      title={t.errors.notFoundTitle}
      body={t.errors.notFoundBody}
      action={
        <Button variant="secondary" onClick={() => void navigate('/')}>
          {t.errors.goHome}
        </Button>
      }
    />
  );
}
