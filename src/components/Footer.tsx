import { Globe, Mail } from 'lucide-react';
import type { Dict } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import styles from './Footer.module.css';

interface Props {
  dict: Dict['footer'];
  locale: Locale;
}

export default function Footer({ dict, locale }: Props) {
  void locale; // reserved for future per-locale legal links
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.logo} aria-label="DAEHAN TRADE">
              <span className={styles.logoSymbol} aria-hidden="true" />
              <span className={styles.logoText}>
                <span className={styles.logoKr}>대한무역</span>
                <span className={styles.logoEn}>DAEHAN TRADE</span>
              </span>
            </div>
            <p className={styles.brandDesc}>{dict.tagline}</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h6>{dict.sections.company.heading}</h6>
              {dict.sections.company.links.map((label) => (
                <a key={label} href="#">{label}</a>
              ))}
            </div>
            <div className={styles.linkGroup}>
              <h6>{dict.sections.business.heading}</h6>
              {dict.sections.business.links.map((label) => (
                <a key={label} href="#">{label}</a>
              ))}
            </div>
            <div className={styles.linkGroup}>
              <h6>{dict.sections.legal.heading}</h6>
              {dict.sections.legal.links.map((label, i) => (
                <a key={label} href="#">
                  {i === dict.sections.legal.links.length - 1 ? <strong>{label}</strong> : label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>{dict.copyright}</p>
          <div className={styles.socialLinks}>
            <a href="#" aria-label="Globe">
              <Globe size={20} />
            </a>
            <a href="#" aria-label="Mail">
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
