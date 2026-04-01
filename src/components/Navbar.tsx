'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
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
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth',
      });
      setIsMobileMenuOpen(false); // Close the menu when link is clicked
    }
  };

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoKr}>대한무역</span>
          <span className={styles.logoEn}>DAEHAN TRADING</span>
        </Link>
        <nav className={styles.navLinks}>
          <a
            href="#hero"
            className={activeLink === 'hero' ? styles.active : ''}
            onClick={(e) => handleNavClick(e, 'hero')}
          >
            기업 비전
          </a>
          <a
            href="#news"
            className={activeLink === 'news' ? styles.active : ''}
            onClick={(e) => handleNavClick(e, 'news')}
          >
            최신 동향
          </a>
          <a
            href="#global"
            className={activeLink === 'global' ? styles.active : ''}
            onClick={(e) => handleNavClick(e, 'global')}
          >
            글로벌 네트워크
          </a>
          <a
            href="#contact"
            className={activeLink === 'contact' ? styles.active : ''}
            onClick={(e) => handleNavClick(e, 'contact')}
          >
            문의하기
          </a>
        </nav>
        <div className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNavLinks}>
          <a href="#hero" onClick={(e) => handleNavClick(e, 'hero')}>기업 비전</a>
          <a href="#news" onClick={(e) => handleNavClick(e, 'news')}>최신 동향</a>
          <a href="#global" onClick={(e) => handleNavClick(e, 'global')}>글로벌 네트워크</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')}>문의하기</a>
        </nav>
      </div>
    </header>
  );
}
