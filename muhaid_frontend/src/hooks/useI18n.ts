import { use } from 'react';

import {
  LanguageContext,
  type LanguageContextValue,
} from '../lib/i18n/LanguageContext';
import type { Messages } from '../lib/i18n/messages';

function useLanguageContext(): LanguageContextValue {
  const ctx = use(LanguageContext);
  if (!ctx)
    throw new Error('useT/useLang must be used inside <LanguageProvider>');
  return ctx;
}

/** The dictionary for the current language: `const t = useT(); t.common.save`. */
export function useT(): Messages {
  return useLanguageContext().t;
}

/** The current language and direction, and the setter for the language switch. */
export function useLang(): Omit<LanguageContextValue, 't'> {
  const { lang, dir, setLang } = useLanguageContext();
  return { lang, dir, setLang };
}
