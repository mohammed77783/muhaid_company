import type { JSX } from 'react';

import { useLang, useT } from '../../hooks/useI18n';
import { cx } from '../../lib/cx';
import styles from './LanguageSwitch.module.css';

interface LanguageSwitchProps {
  className?: string;
}

/** Names the other language in that language. Takes its colour from the bar it sits on. */
export function LanguageSwitch({
  className,
}: LanguageSwitchProps): JSX.Element {
  const t = useT();
  const { lang, setLang } = useLang();
  const other = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      lang={other}
      className={cx(styles.root, className)}
      aria-label={t.language.switchToLabel}
      title={t.language.switchToLabel}
      onClick={() => setLang(other)}
    >
      {t.language.switchTo}
    </button>
  );
}
