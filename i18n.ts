import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Locale configuration
export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

// For static exports, this config is used during build time
// Messages are also loaded directly in the layout component for runtime
export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from request - next-intl extracts it from [locale] segment
  // The locale comes from the [locale] segment in the URL path
  let locale = await requestLocale;

  // If locale is not available, it means we're not in a [locale] route
  // This should not happen in normal operation, but we handle it gracefully
  if (!locale) {
    // Default to 'en' if locale is not available (shouldn't happen with [locale] segment)
    locale = 'en';
  }

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const validLocale = locale as Locale;
  
  // Load messages with error handling
  let messages;
  try {
    messages = (await import(`./messages/${validLocale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${validLocale}:`, error);
    // Fallback to English if locale file is missing or invalid
    try {
      messages = (await import(`./messages/en.json`)).default;
    } catch (fallbackError) {
      console.error('Failed to load fallback messages:', fallbackError);
      // If even fallback fails, provide empty messages object to prevent crash
      messages = {};
    }
  }
  
  return {
    locale: validLocale,
    messages
  };
});

