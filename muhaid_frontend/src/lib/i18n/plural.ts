import { formatNumber } from '../format';
import { localeFor, type Lang } from './types';

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

/**
 * Picks the plural form for `count` and fills `{n}` with the localised number.
 * Arabic uses all six categories (zero, one, two, few, many, other), so pass whole
 * phrases rather than building them from fragments. A `zero` form is used for 0 in
 * every language, so English can say "No results" too.
 */
export function plural(lang: Lang, count: number, forms: PluralForms): string {
  const rule =
    count === 0 && forms.zero
      ? 'zero'
      : new Intl.PluralRules(localeFor(lang)).select(count);
  const form = forms[rule] ?? forms.other;
  return form.replace('{n}', formatNumber(count, lang));
}
