// i18n configuration
// Single source of truth for supported locales, default, RTL set, and cookie name.
// Imported by proxy.ts (root), [lang]/layout.tsx, get-dictionary.ts, LanguageSwitcher.

export const LOCALES = ['ko', 'en', 'zh', 'ar', 'ru', 'uz'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';

export const RTL_LOCALES: ReadonlySet<Locale> = new Set(['ar']);
export const isRTL = (locale: Locale): boolean => RTL_LOCALES.has(locale);

export const COOKIE_NAME = 'daehan_locale';

// Native display name shown in the LanguageSwitcher trigger and rows.
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  zh: '中文',
  ar: 'العربية',
  ru: 'Русский',
  uz: 'Oʻzbekcha',
};

// Type guard used by the [lang] route to 404 on unsupported locales.
export const hasLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);
