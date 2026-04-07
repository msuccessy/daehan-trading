'use client';

import { Fragment, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import styles from './HeroSlider.module.css';
import type { Dict } from '@/i18n/get-dictionary';

interface Props {
  dict: Dict['hero'];
}

const SLIDE_IMAGES = [
  '/assets/hero1_1775021872593.png',
  '/assets/hero2_1775021886843.png',
];

export default function HeroSlider({ dict }: Props) {
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
        onAutoplayTimeLeft={(s, time, p) => {
          setProgress(1 - p);
        }}
        className={styles.swiper}
      >
        {dict.slides.map((slide, idx) => (
          <SwiperSlide key={idx} className={styles.slide}>
            <Image
              src={SLIDE_IMAGES[idx] ?? SLIDE_IMAGES[0]}
              alt={slide.alt}
              fill
              className={styles.slideBg}
              priority={idx === 0}
            />
            <div className={styles.slideOverlay}></div>
            <div className={styles.slideContent}>
              <span className={styles.slideSubtitle}>{slide.subtitle}</span>
              <h1 className={styles.slideTitle}>
                {slide.titleLines.map((line, i) => (
                  <Fragment key={i}>
                    {line}
                    {i < slide.titleLines.length - 1 && <br />}
                  </Fragment>
                ))}
              </h1>
              <p className={styles.slideDesc}>{slide.desc}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className={styles.sliderControls}>
        <div className={styles.sliderProgressContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className={styles.sliderNav}>
          <button className={`slidePrev ${styles.navBtn}`} aria-label="Previous">
            <ChevronLeft size={24} />
          </button>
          <button className={`slideNext ${styles.navBtn}`} aria-label="Next">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}
