import { Mail } from 'lucide-react';
import type { Dict } from '@/i18n/get-dictionary';
import type { Locale } from '@/i18n/config';
import styles from './Footer.module.css';

interface Props {
  dict: Dict['footer'];
  navDict: Dict['nav'];
  locale: Locale;
}

export default function Footer({ dict, navDict, locale }: Props) {
  void locale;
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <span className={styles.logoSymbol} aria-hidden="true" />
              <span className={styles.logoText}>
                <span className={styles.logoKr}>대한무역</span>
                <span className={styles.logoEn}>DAEHAN TRADE</span>
              </span>
            </div>
            <p className={styles.brandDesc}>{dict.tagline}</p>
          </div>
          <nav className={styles.footerNav}>
            <a href="#hero">{navDict.vision}</a>
            <a href="#news">{navDict.news}</a>
            <a href="#global">{navDict.global}</a>
            <a href="#contact">{navDict.contact}</a>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>{dict.copyright}</p>
          <a href="mailto:cs@daehantrade.kr" className={styles.mailLink} aria-label="Email">
            <Mail size={18} />
            <span>cs@daehantrade.kr</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
