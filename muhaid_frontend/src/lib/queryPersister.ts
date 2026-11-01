import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';
import { del, get, set } from 'idb-keyval';

export const queryPersister = createAsyncStoragePersister({
  storage: { getItem: get, setItem: set, removeItem: del },
});

/**
 * Only what the inspector needs offline goes to disk: the signed-in user and the /web
 * resources. Admin data needs no offline support, and photos are large and easy to refetch.
 */
export function shouldPersistQuery(query: Query): boolean {
  const [root] = query.queryKey;
  return (
    (root === 'auth' || root === 'web') && query.state.status === 'success'
  );
}
