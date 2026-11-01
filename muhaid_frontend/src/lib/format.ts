import { localeFor, type Lang } from './i18n/types';

/** A count in prose, grouped for the language (always Western digits). */
export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(localeFor(lang)).format(value);
}

/** "2.1 MB" / «٢٫١ م.ب», precise to one decimal so a limit can be compared. */
export function formatFileSize(bytes: number, lang: Lang): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 0.1) {
    const n = new Intl.NumberFormat(localeFor(lang), {
      maximumFractionDigits: 1,
    }).format(mb);
    return lang === 'ar' ? `${n} م.ب` : `${n} MB`;
  }
  const kb = new Intl.NumberFormat(localeFor(lang), {
    maximumFractionDigits: 0,
  }).format(Math.max(1, bytes / 1024));
  return lang === 'ar' ? `${kb} ك.ب` : `${kb} KB`;
}
