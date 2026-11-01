import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { clearToken } from '../lib/authToken';
import { queryPersister } from '../lib/queryPersister';

/**
 * Tokens are stateless, so there is no logout endpoint: this only forgets them. It clears
 * server data from memory and disk, but never the outbox, which is the only copy of unsent
 * work. Its entries carry their inspector's id, so nobody else's token can send them.
 */
export function useLogout(): () => void {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(() => {
    clearToken();
    queryClient.clear();
    void queryPersister.removeClient();
    void navigate('/login', { replace: true });
  }, [queryClient, navigate]);
}
