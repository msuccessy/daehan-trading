import 'server-only';
import type { Locale } from './config';

// Dynamic imports keep each dictionary out of the client bundle and let
// Next.js code-split per locale. Server components consume the result and
// pass slices into client components as props.
const loaders = {
  ko: () => import('./dictionaries/ko.json').then((m) => m.default),
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  zh: () => import('./dictionaries/zh.json').then((m) => m.default),
  ar: () => import('./dictionaries/ar.json').then((m) => m.default),
  ru: () => import('./dictionaries/ru.json').then((m) => m.default),
  uz: () => import('./dictionaries/uz.json').then((m) => m.default),
} as const;

export const getDictionary = (locale: Locale) => loaders[locale]();

// Structural type derived from the Korean source-of-truth dictionary.
// All other locale files must satisfy this shape (TypeScript will fail the
// build if a key drifts).
export type Dict = Awaited<ReturnType<typeof loaders.ko>>;
