import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';

import { LanguageContext, type LanguageContextValue } from './LanguageContext';
import { messages } from './messages';
import { DEFAULT_LANG, dirFor, isLang, type Lang } from './types';

const STORAGE_KEY = 'muhaid.lang';

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLang(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Owns the UI language. Direction is set once on <html>, never passed to components:
 * every stylesheet uses logical properties, so one layout serves both.
 */
export function LanguageProvider({
  children,
}: LanguageProviderProps): JSX.Element {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice still applies for this visit.
    }
    setLangState(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, dir: dirFor(lang), t: messages[lang], setLang }),
    [lang, setLang],
  );

  return <LanguageContext value={value}>{children}</LanguageContext>;
}
