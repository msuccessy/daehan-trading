'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import type { Locale } from '@/i18n/config';
import type { Dict } from '@/i18n/get-dictionary';
import styles from './Navbar.module.css';

interface Props {
  dict: Dict;
  locale: Locale;
}

export default function Navbar({ dict, locale }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = document.querySelectorAll('section');
      let current = '';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 150) {
          current = section.getAttribute('id') || '';
        }
      });
      setActiveLink(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const isMobile = window.innerWidth <= 768;
      const offset = isMobile ? 60 : 0;
      window.scrollTo({
        top: targetElement.offsetTop - offset,
        behavior: 'smooth',
      });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <Link href={`/${locale}`} className={styles.logo} aria-label={dict.logo.ariaLabel}>
          <span className={styles.logoSymbol} aria-hidden="true">
            <span className={`${styles.logoSymbolImg} ${styles.logoSymbolLight}`} />
            <span className={`${styles.logoSymbolImg} ${styles.logoSymbolDark}`} />
          </span>
          <span className={styles.logoText}>
            <span className={styles.logoKr}>대한무역</span>
            <span className={styles.logoEn}>DAEHAN TRADE</span>
          </span>
        </Link>
        <nav className={styles.navLinks}>
          <a
            href="#hero"
            className={activeLink === 'hero' ? styles.active : ''}
            onClick={(e) => handleNavClick(e, 'hero')}
          >
            {dict.nav.vision}
          </a>
          <a
            href="#news"
            className={activeLink === 'news' ? styles.active : ''}
            onClick={(e) => handleNavClick(e, 'news')}
          >
            {dict.nav.news}
          </a>
          <a
            href="#global"
            className={activeLink === 'global' ? styles.active : ''}
            onClick={(e) => handleNavClick(e, 'global')}
          >
            {dict.nav.global}
          </a>
          <a
            href="#contact"
            className={activeLink === 'contact' ? styles.active : ''}
            onClick={(e) => handleNavClick(e, 'contact')}
          >
            {dict.nav.contact}
          </a>
        </nav>
        <div className={styles.navRight}>
          <LanguageSwitcher locale={locale} switcherDict={dict.switcher} theme={scrolled ? "light" : "dark"} />
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNavLinks}>
          <a href="#hero" onClick={(e) => handleNavClick(e, 'hero')}>{dict.nav.vision}</a>
          <a href="#news" onClick={(e) => handleNavClick(e, 'news')}>{dict.nav.news}</a>
          <a href="#global" onClick={(e) => handleNavClick(e, 'global')}>{dict.nav.global}</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')}>{dict.nav.contact}</a>
        </nav>
        <div className={styles.mobileLangSwitcher}>
          <LanguageSwitcher locale={locale} switcherDict={dict.switcher} theme="dark" />
        </div>
      </div>
    </header>
  );
}
