import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LocaleHtml } from '@/components/LocaleHtml';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "ADHD Assessment Platform | Comprehensive ADHD Testing Tools",
  description: "Comprehensive ADHD assessment tools including questionnaire, CPT-3, and TOVA tests. Learn about ADHD symptoms, diagnosis, treatment options, and medications.",
  keywords: ["ADHD", "ADHD assessment", "ADHD test", "attention deficit", "CPT-3", "TOVA", "ADHD diagnosis"],
  authors: [{ name: "ADHD Assessment Platform" }],
  openGraph: {
    title: "ADHD Assessment Platform",
    description: "Comprehensive ADHD assessment tools and educational resources",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  // Handle both sync and async params (Next.js 15+ uses async params)
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // For static exports, load messages directly with error handling
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to English if locale file is missing or invalid
    try {
      messages = (await import(`@/messages/en.json`)).default;
    } catch (fallbackError) {
      console.error('Failed to load fallback messages:', fallbackError);
      // If even fallback fails, provide empty messages object to prevent crash
      messages = {};
    }
  }

  return (
    <ErrorBoundary>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <LocaleHtml />
        {children}
      </NextIntlClientProvider>
    </ErrorBoundary>
  );
}

