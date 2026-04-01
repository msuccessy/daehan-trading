'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import styles from './HeroSlider.module.css';

export default function HeroSlider() {
  const [progress, setProgress] = useState(0);
  
  return (
    <section id="hero" className={styles.heroSection}>
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Pagination]}
        effect="fade"
        speed={1000}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
        }}
        navigation={{
          prevEl: '.slidePrev',
          nextEl: '.slideNext',
        }}
        onAutoplayTimeLeft={(s, time, progress) => {
          setProgress(1 - progress);
        }}
        className={styles.swiper}
      >
        <SwiperSlide className={styles.slide}>
          <Image 
            src="/assets/hero1_1775021872593.png" 
            alt="글로벌 유통망" 
            fill 
            className={styles.slideBg}
            priority
          />
          <div className={styles.slideOverlay}></div>
          <div className={styles.slideContent}>
            <span className={styles.slideSubtitle}>Global Standard</span>
            <h1 className={styles.slideTitle}>단말기 거래망의<br />새로운 기준을 세우다</h1>
            <p className={styles.slideDesc}>아시아를 넘어 유럽, 북동아프리카로 확장되는 대한무역의 네트워크</p>
          </div>
        </SwiperSlide>

        <SwiperSlide className={styles.slide}>
          <Image 
            src="/assets/hero2_1775021886843.png" 
            alt="프리미엄 기기" 
            fill 
            className={styles.slideBg} 
          />
          <div className={styles.slideOverlay}></div>
          <div className={styles.slideContent}>
            <span className={styles.slideSubtitle}>Premium Quality</span>
            <h1 className={styles.slideTitle}>탁월한 품질을 위한<br />정밀 검증 프로세스</h1>
            <p className={styles.slideDesc}>고가치 기기 중심의 무결점 퀄리티, 언제나 신뢰할 수 있는 단말기만을 취급합니다</p>
          </div>
        </SwiperSlide>
      </Swiper>

      <div className={styles.sliderControls}>
        <div className={styles.sliderProgressContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className={styles.sliderNav}>
          <button className={`slidePrev ${styles.navBtn}`}>
            <ChevronLeft size={24} />
          </button>
          <button className={`slideNext ${styles.navBtn}`}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}
