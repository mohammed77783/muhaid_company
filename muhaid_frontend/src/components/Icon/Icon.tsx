import type { CSSProperties, JSX } from 'react';

import { cx } from '../../lib/cx';
import styles from './Icon.module.css';
import { icons, type IconName } from './icons';

interface IconProps {
  name: IconName;
  /** px; 20 by default. Directional glyphs mirror automatically under dir="rtl". */
  size?: number;
  /** Supplying a title makes the glyph a labelled image instead of decoration. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({
  name,
  size = 20,
  title,
  className,
  style,
}: IconProps): JSX.Element {
  const spec: { d: string; c?: number[]; dir?: boolean } = icons[name];
  return (
    <svg
      className={cx(styles.root, spec.dir && styles.dir, className)}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      style={style}
    >
      {title && <title>{title}</title>}
      {spec.c && <circle cx={spec.c[0]} cy={spec.c[1]} r={spec.c[2]} />}
      <path d={spec.d} />
    </svg>
  );
}
