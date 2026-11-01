import type { JSX, ReactNode } from 'react';

import { useT } from '../../hooks/useI18n';
import { Button } from '../Button';
import { Dialog } from '../Dialog';

interface ConfirmDialogProps {
  /** The question, in the person's words: «إيقاف هذا الحساب؟» */
  title: ReactNode;
  /** The consequence: what stops working, and what survives. */
  children?: ReactNode;
  /** danger = irreversible or account-affecting; warning = recoverable. */
  variant?: 'danger' | 'warning';
  open?: boolean;
  /** Repeats the verb being confirmed: «إيقاف الحساب», never «تأكيد» alone. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** The confirmed action is running: blocks both buttons and Esc. */
  loading?: boolean;
  /** Bottom sheet presentation, for the field app. */
  sheet?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

/** Cancel is always first and a text button, so the risky one is never the default look. */
export function ConfirmDialog({
  title,
  children,
  variant = 'warning',
  open = true,
  confirmLabel,
  cancelLabel,
  loading = false,
  sheet = false,
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps): JSX.Element {
  const t = useT();
  const danger = variant === 'danger';
  return (
    <Dialog
      title={title}
      mark={danger ? 'danger' : 'warning'}
      open={open}
      sheet={sheet}
      onClose={loading ? false : onCancel}
      className={className}
      actions={
        <>
          <Button variant="text" disabled={loading} onClick={onCancel}>
            {cancelLabel ?? t.common.cancel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel ?? t.common.confirm}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
