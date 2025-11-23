'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'fr' : 'en';
    // Save locale preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    // Remove current locale from pathname and add new one
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
  };

  if (!mounted) {
    return (
      <div className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
        {locale === 'en' ? 'EN' : 'FR'}
      </div>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`Switch to ${locale === 'en' ? 'French' : 'English'}`}
    >
      {locale === 'en' ? 'FR' : 'EN'}
    </button>
  );
}

