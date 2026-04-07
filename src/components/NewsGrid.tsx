import Image from 'next/image';
import { getLatestNews } from '@/lib/news';
import type { Dict } from '@/i18n/get-dictionary';
import styles from './NewsGrid.module.css';

interface Props {
  dict: Dict['news'];
}

export default async function NewsGrid({ dict }: Props) {
  // The news pipeline currently aggregates Korean RSS sources only. Localized
  // labels surround the cards; if/when localized feeds land, getLatestNews()
  // can take a locale arg. For now we pass the chrome through the dict.
  const newsItems = await getLatestNews();

  return (
    <section id="news" className={`section-padding ${styles.newsSection}`}>
      <div className="container">
        <div className={styles.newsHeader}>
          <div className={styles.headerText}>
            <span className="section-badge">{dict.badge}</span>
            <h2 className="section-title">{dict.title}</h2>
            <p className="section-desc">{dict.desc}</p>
            {dict.sourceLanguageNote && (
              <p className={styles.sourceNote}>{dict.sourceLanguageNote}</p>
            )}
          </div>
        </div>

        <div className={styles.newsGrid}>
          {newsItems.length > 0 ? (
            newsItems.map((news) => (
              <a
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                key={news.id}
                className={styles.newsCard}
              >
                <div className={styles.newsImageWrapper}>
                  <Image
                    src={news.image}
                    alt={news.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={styles.newsImage}
                    unoptimized={news.image.startsWith('http')}
                  />
                  <div className={styles.newsCategory}>{news.sourceName}</div>
                </div>
                <div className={styles.newsContent}>
                  <div className={styles.newsMeta}>
                    <span className={styles.newsSource} lang="ko" dir="ltr">{news.sourceName}</span>
                    <span className={styles.newsMetaDot} aria-hidden="true">·</span>
                    <span className={styles.newsDate} lang="ko" dir="ltr">{news.date}</span>
                  </div>
                  {/* All RSS sources are Korean — pin lang/dir so non-Korean
                      locales don't apply Arabic/CJK fonts to Hangul or flip
                      the Korean text into RTL flow. */}
                  <h3 className={styles.newsHeadline} lang="ko" dir="ltr">{news.title}</h3>
                  <p className={styles.newsSummary} lang="ko" dir="ltr">{news.preview}</p>
                  <div className={styles.newsCta}>
                    <span>{dict.readMore}</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <p
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: 'var(--color-text-light)',
              }}
            >
              {dict.fallback}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
