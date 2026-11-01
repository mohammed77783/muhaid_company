import { Suspense, type JSX, type ReactNode } from 'react';

import { useT } from '../../hooks/useI18n';
import { Skeleton } from '../Skeleton';
import styles from './SuspenseLoader.module.css';

type LoaderLayout = 'page' | 'cards' | 'table';

interface SuspenseLoaderProps {
  children: ReactNode;
  /** The shape the screen is about to become. */
  layout?: LoaderLayout;
  /** Replaces the layout, e.g. a block sized like the photo it waits for. */
  fallback?: ReactNode;
}

function LoaderShape({ layout }: { layout: LoaderLayout }): JSX.Element {
  const t = useT();
  return (
    <div className={styles.root}>
      {/* A loading region announces once, not per shape. */}
      <span role="status" className="sr-only">
        {t.common.loading}
      </span>
      {layout === 'cards' &&
        [0, 1, 2].map((i) => <Skeleton key={i} variant="card" />)}
      {layout === 'table' && (
        <>
          <Skeleton variant="block" height={72} />
          <Skeleton variant="block" height={320} />
        </>
      )}
      {layout === 'page' && (
        <>
          <Skeleton width="40%" height={24} />
          <Skeleton lines={4} />
          <Skeleton variant="block" height={168} />
        </>
      )}
    </div>
  );
}

/** Reads use Suspense, so a waiting screen shows Skeleton shapes, never a spinner. */
export function SuspenseLoader({
  children,
  layout = 'page',
  fallback,
}: SuspenseLoaderProps): JSX.Element {
  return (
    <Suspense fallback={fallback ?? <LoaderShape layout={layout} />}>
      {children}
    </Suspense>
  );
}
