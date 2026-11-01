import { Fragment, type JSX, type ReactNode } from 'react';

import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import styles from './Card.module.css';

interface CardProps {
  title: ReactNode;
  /** The small facts under the title, separated by a middle dot. */
  meta?: ReactNode[];
  /** At the row's end: a status chip. */
  trailing?: ReactNode;
  /** Between the row and the footer. */
  children?: ReactNode;
  /** Behind a hairline. Holds buttons only when the card has no onClick. */
  footer?: ReactNode;
  failed?: boolean;
  /** Makes the whole card a button, with a chevron at its end. */
  onClick?: () => void;
  className?: string;
}

/** The frame FormCard, InspectionCard and OutboxEntry share. Uses spans: it can be a button. */
export function Card({
  title,
  meta,
  trailing,
  children,
  footer,
  failed = false,
  onClick,
  className,
}: CardProps): JSX.Element {
  const content = (
    <>
      <span className={styles.row}>
        <span className={styles.grow}>
          <span className={styles.title} dir="auto">
            {title}
          </span>
          {meta && meta.length > 0 && (
            <span className={styles.meta}>
              {meta.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {item}
                </Fragment>
              ))}
            </span>
          )}
        </span>
        {trailing}
        {onClick && (
          <Icon name="chevronEnd" size={20} className={styles.chevron} />
        )}
      </span>
      {children}
      {footer && <span className={styles.footer}>{footer}</span>}
    </>
  );

  const classes = cx(
    styles.root,
    onClick && styles.action,
    failed && styles.failed,
    className,
  );

  return onClick ? (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={classes}>{content}</div>
  );
}
