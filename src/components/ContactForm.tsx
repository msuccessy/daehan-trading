import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  return (
    <section id="contact" className={`section-padding ${styles.contactSection}`}>
      <div className="container">
        <div className={styles.contactWrapper}>
          <div className={styles.contactInfo}>
            <span className="section-badge">Contact Us</span>
            <h2 className="section-title">비즈니스 파트너십 문의</h2>
            <p className="section-desc">안전하고 신속한 대량 수출입 거래를 위해<br/>대한무역의 담당자가 빠르게 답변해 드립니다.</p>
            
            <div className={styles.infoBlocks}>
              <div className={styles.infoBlock}>
                <MapPin className={styles.infoIcon} size={24} />
                <div>
                  <h5>본사 주소</h5>
                  <p>서울특별시 강남구 테헤란로 123 대한빌딩 15층</p>
                </div>
              </div>
              <div className={styles.infoBlock}>
                <Phone className={styles.infoIcon} size={24} />
                <div>
                  <h5>대표 전화</h5>
                  <p>02-1234-5678</p>
                </div>
              </div>
              <div className={styles.infoBlock}>
                <Mail className={styles.infoIcon} size={24} />
                <div>
                  <h5>이메일</h5>
                  <p>trade@daehan-trading.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.formContainer}>
            <form className={styles.contactForm}>
              <div className={styles.formGroup}>
                <label htmlFor="company">회사명</label>
                <input type="text" id="company" name="company" placeholder="Ex) 애플, 삼성..." required />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">담당자명</label>
                  <input type="text" id="name" name="name" placeholder="홍길동" required />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone">연락처</label>
                  <input type="tel" id="phone" name="phone" placeholder="010-0000-0000" required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">이메일</label>
                <input type="email" id="email" name="email" placeholder="example@domain.com" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="message">문의 내용</label>
                <textarea id="message" name="message" rows={4} placeholder="수출입 물량, 브랜드, 원하시는 조건 등을 남겨주세요." required></textarea>
              </div>
              <button type="button" className={styles.submitBtn}>
                문의 접수하기 <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
