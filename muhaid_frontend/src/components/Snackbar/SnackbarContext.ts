import { createContext, type ReactNode } from 'react';

import type { SnackbarVariant } from './Snackbar';

export interface SnackbarOptions {
  message: ReactNode;
  variant?: SnackbarVariant;
  actionLabel?: string;
  /** Runs before the snackbar dismisses itself. */
  onAction?: () => void;
}

export interface SnackbarContextValue {
  /** Queues a snackbar. One shows at a time; an identical waiting message is dropped. */
  show: (options: SnackbarOptions) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);
