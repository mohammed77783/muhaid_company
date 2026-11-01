import {
  useId,
  useLayoutEffect,
  useRef,
  type JSX,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import styles from './Dialog.module.css';

export interface DialogProps {
  /** Names the task, not the object. */
  title: ReactNode;
  children?: ReactNode;
  open?: boolean;
  size?: 'default' | 'wide';
  /** Renders as a bottom sheet with a grip: the mobile presentation. */
  sheet?: boolean;
  mark?: 'danger' | 'warning';
  /** Pass false to drop the close button (a decision the user must make). */
  onClose?: false | (() => void);
  closeLabel?: string;
  /** The footer: Cancel as a text button, then one primary action. */
  actions?: ReactNode;
  className?: string;
}

/** Open dialogs, so the page only comes back to life when the last one closes. */
let openCount = 0;

function setPageInert(inert: boolean): void {
  const page = document.getElementById('root');
  if (page) page.inert = inert;
  document.body.style.overflow = inert ? 'hidden' : '';
}

/**
 * A modal rendered beside #root, with #root made inert: that traps focus and blocks the
 * page behind it. Not a native showModal(), which would also make the snackbar inert, and
 * a failure must stay actionable while a dialog is open. Renders nothing while closed, so
 * a form inside starts fresh each time.
 */
export function Dialog({
  title,
  children,
  open = true,
  size = 'default',
  sheet = false,
  mark,
  onClose,
  closeLabel,
  actions,
  className,
}: DialogProps): JSX.Element | null {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = document.activeElement;
    openCount += 1;
    setPageInert(true);
    // A form starts on its field; anything else starts on its first control.
    const el = ref.current;
    const first =
      el?.querySelector<HTMLElement>('input, select, textarea') ??
      el?.querySelector<HTMLElement>('button');
    first?.focus();
    return () => {
      openCount -= 1;
      if (openCount === 0) setPageInert(false);
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !onClose) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && onClose) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={cx(styles.overlay, sheet && styles.overlaySheet)}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          styles.root,
          size === 'wide' && styles.wide,
          sheet && styles.sheet,
          className,
        )}
      >
        {sheet && <div className={styles.grip} />}
        <div className={styles.head}>
          {mark && (
            <span className={cx(styles.mark, styles[mark])}>
              <Icon name={mark === 'danger' ? 'alert' : 'info'} size={22} />
            </span>
          )}
          <div id={titleId} className={styles.title}>
            {title}
          </div>
          {onClose && (
            <IconButton
              icon="close"
              size="sm"
              label={closeLabel ?? t.common.close}
              onClick={onClose}
            />
          )}
        </div>
        <div className={styles.body}>{children}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
