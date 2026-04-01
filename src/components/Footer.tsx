import { Globe, Mail } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <span className={styles.logoKr}>대한무역</span>
              <span className={styles.logoEn}>DAEHAN TRADING</span>
            </div>
            <p className={styles.brandDesc}>글로벌 중고 모바일 디바이스 수출의 메가 허브</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h6>COMPANY</h6>
              <a href="#">회사 소개</a>
              <a href="#">경영 철학</a>
              <a href="#">홍보 센터</a>
            </div>
            <div className={styles.linkGroup}>
              <h6>BUSINESS</h6>
              <a href="#">글로벌 B2B 수출입</a>
              <a href="#">프리미엄 단말기 유통</a>
              <a href="#">전문 품질 검수 솔루션</a>
            </div>
            <div className={styles.linkGroup}>
              <h6>LEGAL</h6>
              <a href="#">이용약관</a>
              <a href="#"><strong>개인정보처리방침</strong></a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>© 2026 DAEHAN TRADING Corp. All Rights Reserved.</p>
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
