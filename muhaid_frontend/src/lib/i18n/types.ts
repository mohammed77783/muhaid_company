export type Lang = 'ar' | 'en';
export type Dir = 'rtl' | 'ltr';

export const DEFAULT_LANG: Lang = 'ar';

export function isLang(value: unknown): value is Lang {
  return value === 'ar' || value === 'en';
}

export function dirFor(lang: Lang): Dir {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Intl locale. Arabic stays on the Gregorian calendar the API uses, and on Western
 * digits: one convention across prose, fields and tables (rtl-and-language.md).
 */
export function localeFor(lang: Lang): string {
  return lang === 'ar' ? 'ar-u-ca-gregory-nu-latn' : 'en-GB';
}
