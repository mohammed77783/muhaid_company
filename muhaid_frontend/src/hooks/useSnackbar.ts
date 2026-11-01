import { use } from 'react';

import {
  SnackbarContext,
  type SnackbarContextValue,
} from '../components/Snackbar';

export function useSnackbar(): SnackbarContextValue {
  const ctx = use(SnackbarContext);
  if (!ctx)
    throw new Error('useSnackbar must be used inside <SnackbarProvider>');
  return ctx;
}
