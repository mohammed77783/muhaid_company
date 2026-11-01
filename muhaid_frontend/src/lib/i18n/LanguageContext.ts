import { createContext } from 'react';

import type { Messages } from './messages';
import type { Dir, Lang } from './types';

export interface LanguageContextValue {
  lang: Lang;
  dir: Dir;
  /** The dictionary for the current language. */
  t: Messages;
  setLang: (lang: Lang) => void;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
