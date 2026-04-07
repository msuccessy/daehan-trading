import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Inter, Noto_Sans_KR, Noto_Sans_SC, Noto_Sans_Arabic } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { LOCALES, DEFAULT_LOCALE, isRTL, hasLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import '../globals.css';

// Latin / Cyrillic / Vietnamese subsets so Inter covers en, ru, uz with one family.
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

// Korean
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-notoSans',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

// Simplified Chinese — only loaded by /zh route
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sc',
  weight: ['400', '500', '700'],
  display: 'swap',
});

// Arabic — only loaded by /ar route
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-arabic',
  weight: ['400', '500', '700'],
  display: 'swap',
});

// Statically generate every locale at build time.
export function generateStaticParams() {
  return (LOCALES as readonly string[]).map((lang) => ({ lang }));
}

// Per-locale <title> and <meta description>, plus hreflang alternates.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const languages: Record<string, string> = { 'x-default': `/${DEFAULT_LOCALE}` };
  for (const l of LOCALES) languages[l] = `/${l}`;

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: { languages },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const locale: Locale = lang;

  const fontVars = [
    inter.variable,
    notoSansKR.variable,
    locale === 'zh' ? notoSansSC.variable : '',
    locale === 'ar' ? notoSansArabic.variable : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <html lang={locale} dir={isRTL(locale) ? 'rtl' : 'ltr'}>
      <body className={fontVars} data-locale={locale}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
