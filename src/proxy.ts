// Next.js 16 Proxy (formerly Middleware).
// Detects the visitor's preferred locale and redirects requests under `/`
// to the localized subpath. Cookie wins over Accept-Language so the
// in-page LanguageSwitcher's choice persists across visits.

import { NextResponse, type NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { LOCALES, DEFAULT_LOCALE, COOKIE_NAME, type Locale } from '@/i18n/config';

function detectLocale(req: NextRequest): Locale {
  // 1. Cookie always wins (explicit user choice)
  const cookieLocale = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  // 2. Accept-Language negotiation
  const headerValue = req.headers.get('accept-language') ?? '';
  if (!headerValue) return DEFAULT_LOCALE;

  try {
    const headers = { 'accept-language': headerValue };
    const langs = new Negotiator({ headers }).languages();
    return match(langs, LOCALES as unknown as string[], DEFAULT_LOCALE) as Locale;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip if the pathname already has a supported locale prefix
  const hasLocale = (LOCALES as readonly string[]).some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return;

  // Redirect `/` and any other un-prefixed path to the detected locale
  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

// Match all routes EXCEPT internal Next paths, API routes, static assets,
// the favicon, sitemap.xml, robots.txt, manifest.json, and any path with a
// file extension. The dotted-path exclusion at the end is the catch-all
// guard recommended by both Phase 1 dual voices.
export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|assets|ci|sitemap.xml|robots.txt|manifest.json|.*\\..*).*)',
  ],
};
