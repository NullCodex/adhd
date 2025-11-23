'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export function LocaleHtml() {
  const locale = useLocale();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}

