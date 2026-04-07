'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  LOCALES,
  LOCALE_NATIVE_NAMES,
  COOKIE_NAME,
  type Locale,
} from '@/i18n/config';
import styles from './LanguageSwitcher.module.css';

interface Props {
  locale: Locale;
  switcherDict: { label: string; selected: string };
}

export default function LanguageSwitcher({ locale, switcherDict }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (next: Locale) => {
    if (next === locale || pendingLocale) return;
    setPendingLocale(next);

    // Persist choice in a cookie so the proxy honors it on the next visit
    try {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${COOKIE_NAME}=${next}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
    } catch {
      /* private mode — ignore */
    }

    // Replace the current locale prefix in the pathname with the new one
    const segments = pathname.split('/');
    if (segments.length > 1 && (LOCALES as readonly string[]).includes(segments[1])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    const nextPath = segments.join('/') || `/${next}`;

    startTransition(() => {
      router.push(nextPath);
      // Close after navigation kicks off; pendingLocale stays until route changes
      setTimeout(() => {
        setOpen(false);
        setPendingLocale(null);
      }, 250);
    });
  };

  return (
    <div className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={switcherDict.label}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={18} className={styles.globe} />
        <span className={styles.triggerLabel}>{LOCALE_NATIVE_NAMES[locale]}</span>
        <ChevronDown size={16} className={styles.chevron} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className={styles.panel}
          role="listbox"
          aria-label={switcherDict.label}
        >
          {LOCALES.map((l) => {
            const isCurrent = l === locale;
            const isLoading = pendingLocale === l && isPending;
            return (
              <button
                key={l}
                type="button"
                role="option"
                aria-selected={isCurrent}
                disabled={isCurrent || pendingLocale !== null}
                className={`${styles.option} ${isCurrent ? styles.optionCurrent : ''}`}
                data-locale={l}
                onClick={() => handleSelect(l)}
              >
                <span className={styles.optionLabel}>{LOCALE_NATIVE_NAMES[l]}</span>
                <span className={styles.optionCode}>{l.toUpperCase()}</span>
                {isCurrent && (
                  <Check size={16} className={styles.optionCheck} aria-hidden />
                )}
                {isLoading && <span className={styles.spinner} aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
