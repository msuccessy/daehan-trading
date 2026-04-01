import Image from 'next/image';
import Parser from 'rss-parser';
import styles from './NewsGrid.module.css';

// Initialize RSS Parser
const parser = new Parser();

// Fallback images since RSS often lacks high-res thumbnails
const FALLBACK_IMAGES = [
  '/assets/news1_1775021900289.png',
  '/assets/news2_1775021917360.png',
  '/assets/news3_1775021932568.png'
];

export default async function NewsGrid() {
  let newsItems: any[] = [];
  
  try {
    // Fetch Google News RSS for "중고폰 OR 스마트폰 수출"
    const feed = await parser.parseURL(
      'https://news.google.com/rss/search?q=%EC%A4%91%EA%B3%A0%ED%8F%B0+OR+%EC%8A%A4%EB%A7%88%ED%8A%B8%ED%8F%B0+%EC%88%98%EC%B6%9C&hl=ko&gl=KR&ceid=KR:ko'
    );
    
    // We only need the top 3 items
    newsItems = feed.items.slice(0, 3).map((item, index) => {
      // Clean up the title (Google News often appends "- Source Name" at the end)
      const cleanTitle = item.title ? item.title.split(' - ')[0] : '산업 동향 뉴스';
      
      // Try to extract text snippet from the description (HTML)
      let cleanDesc = item.contentSnippet || '';
      if (cleanDesc.length > 130) cleanDesc = cleanDesc.substring(0, 130) + '...';
      
      return {
        id: index,
        title: cleanTitle,
        date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '최근',
        image: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
        preview: cleanDesc,
        link: item.link || '#'
      };
    });
  } catch (error) {
    console.error('Failed to fetch RSS:', error);
    // Silent fail fallback to empty array or dummy data if wanted
  }

  return (
    <section id="news" className={`section-padding ${styles.newsSection}`}>
      <div className="container">
        {/* Header container with flexbox applied */}
        <div className={styles.newsHeader}>
          <div className={styles.headerText}>
            <span className="section-badge">Industry News</span>
            <h2 className="section-title">산업 동향 및 기업소식</h2>
            <p className="section-desc">급변하는 모바일 시장과 중고 스마트폰 수출 업계의 생생한 최신 뉴스를 전합니다.</p>
          </div>
          <button className={styles.viewAllBtn}>
            최신 뉴스 더보기
          </button>
        </div>
        
        {/* Render News Cards */}
        <div className={styles.newsGrid}>
          {newsItems.length > 0 ? (
            newsItems.map((news) => (
              <a href={news.link} target="_blank" rel="noopener noreferrer" key={news.id} className={styles.newsCard}>
                <div className={styles.newsImageWrapper}>
                  <div className={styles.newsCategory}>보도자료</div>
                  <Image 
                    src={news.image}
                    alt={news.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={styles.newsImage}
                  />
                </div>
                <div className={styles.newsContent}>
                  <div className={styles.newsDate}>{news.date}</div>
                  <h3 className={styles.newsHeadline}>{news.title}</h3>
                  <p className={styles.newsSummary}>{news.preview}</p>
                </div>
              </a>
            ))
          ) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-light)' }}>
              뉴스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
