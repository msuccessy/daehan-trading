import Parser from 'rss-parser';

/**
 * News pipeline
 *
 * Why not Google News RSS:
 *   - Google News RSS only exposes encoded redirect URLs (`news.google.com/rss/articles/CBMi...`)
 *     which load the real article via JS, so og:image extraction returns the
 *     Google News logo instead of the actual article thumbnail.
 *
 * Approach:
 *   1. Pull from multiple Korean news RSS feeds that publish direct article URLs.
 *   2. Score each item by relevance: strong keywords (중고폰/재생폰/자급제/리퍼)
 *      score highest, phone+trade combinations score moderately, generic telecom
 *      infrastructure (통신 케이블, 위성, 5G 인프라) is filtered out.
 *   3. Sort by score then date, take top 3. If no items pass the filter, return
 *      empty so the section shows the "no news" state instead of irrelevant items.
 *   4. Thumbnails: prefer feed-provided `media:content`, fall back to scraping
 *      `og:image` from the real article URL.
 *
 * Caching:
 *   - Each RSS fetch is tagged with `news` and revalidated every 24h.
 *   - Vercel cron at /api/cron/refresh-news triggers `revalidateTag('news', 'max')`
 *     daily at 07:00 KST (= 22:00 UTC), marking the cache as stale.
 */

const SOURCES: ReadonlyArray<{ name: string; url: string }> = [
  // 전자신문 속보 (broad tech/business news, real article URLs, og:image works)
  { name: 'etnews-속보', url: 'https://rss.etnews.com/Section902.xml' },
  // 전자신문 오늘의 추천기사
  { name: 'etnews-추천', url: 'https://rss.etnews.com/Section904.xml' },
  // ZDNet Korea — IT 종합
  { name: 'zdnet-korea', url: 'https://feeds.feedburner.com/zdkorea' },
  // 한국경제 IT
  { name: 'hankyung-it', url: 'https://www.hankyung.com/feed/it' },
  // 매일경제 경제 (provides media:content thumbnails directly)
  { name: 'mk-economy', url: 'https://www.mk.co.kr/rss/30100041/' },
  // 매일경제 전체뉴스 (largest pool, includes all MK sections)
  { name: 'mk-all', url: 'https://www.mk.co.kr/rss/40300001/' },
];

// Strong keywords — direct used-phone / refurb business signals.
const STRONG_KEYWORDS = [
  '중고폰',
  '중고 폰',
  '중고 휴대폰',
  '중고 스마트폰',
  '재생폰',
  '리퍼폰',
  '리퍼비시',
  '리퍼비시드',
  '자급제폰',
  '자급제 스마트폰',
  '단말기 유통',
];

// Phone keywords — generic device mentions, only score when paired with trade signals.
const PHONE_KEYWORDS = [
  '스마트폰',
  '휴대폰',
  '단말기',
  '아이폰',
  '갤럭시',
  '폴더블',
  '폴더블폰',
];

// Trade / market keywords — only count when combined with a phone keyword.
const TRADE_KEYWORDS = [
  '수출',
  '수입',
  '해외',
  '글로벌',
  '무역',
  '판매',
  '유통',
  '시장',
  '점유율',
  '출하',
  '북미',
  '동남아',
  '인도',
  '중동',
];

// Negative keywords — generic telecom infrastructure that we DO NOT want.
const NEGATIVE_KEYWORDS = [
  '위성통신',
  '저궤도',
  '스타링크',
  '공중케이블',
  '전봇대',
  '유료방송',
  '방송법',
  '5G 인프라',
  '6G 인프라',
];

const FALLBACK_IMAGES = [
  '/assets/news1_1775021900289.png',
  '/assets/news2_1775021917360.png',
  '/assets/news3_1775021932568.png',
];

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export type NewsItem = {
  id: number;
  title: string;
  date: string;
  image: string;
  preview: string;
  link: string;
  source: string;
  sourceName: string;
};

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'etnews-속보': '전자신문',
  'etnews-추천': '전자신문',
  'zdnet-korea': 'ZDNet Korea',
  'hankyung-it': '한국경제',
  'mk-economy': '매일경제',
  'mk-all': '매일경제',
};

function prettySourceName(sourceId: string, link: string): string {
  if (SOURCE_DISPLAY_NAMES[sourceId]) return SOURCE_DISPLAY_NAMES[sourceId];
  try {
    const host = new URL(link).hostname.replace(/^www\./, '');
    return host;
  } catch {
    return sourceId;
  }
}

type RawItem = {
  title: string;
  link: string;
  preview: string;
  pubDate: number;
  source: string;
  /** Inline thumbnail URL extracted from media:content (if any) */
  mediaImage?: string;
};

type RssItem = Parser.Item & {
  mediaContent?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  mediaThumbnail?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
};

function extractMediaImage(item: RssItem): string | undefined {
  for (const field of [item.mediaContent, item.mediaThumbnail]) {
    if (!field) continue;
    const list = Array.isArray(field) ? field : [field];
    for (const node of list) {
      const url = node?.$?.url;
      if (typeof url === 'string' && url.startsWith('http')) return url;
    }
  }
  return undefined;
}

async function fetchFeed(source: { name: string; url: string }): Promise<RawItem[]> {
  try {
    const res = await fetch(source.url, {
      next: { tags: ['news'], revalidate: 86400 },
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser: Parser<unknown, RssItem> = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: true }],
          ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
        ],
      },
    });
    const feed = await parser.parseString(xml);
    return feed.items
      .filter((item) => item.link && item.title)
      .map((item) => {
        const cleanTitle = (item.title || '').split(' - ')[0].trim();
        const snippet = (item.contentSnippet || '').trim();
        const preview = snippet.length > 130 ? snippet.slice(0, 130) + '...' : snippet;
        const ts = item.pubDate ? new Date(item.pubDate).getTime() : 0;
        return {
          title: cleanTitle,
          link: item.link as string,
          preview,
          pubDate: Number.isFinite(ts) ? ts : 0,
          source: source.name,
          mediaImage: extractMediaImage(item),
        };
      });
  } catch (err) {
    console.error(`[news] feed failed: ${source.name}`, err);
    return [];
  }
}

/**
 * Score an item by phone-trade relevance.
 *  - Strong keyword match → +15 each (직접 중고폰/리퍼/자급제 등)
 *  - Phone keyword match → +3 each (cap at 2 mentions = +6)
 *  - Trade keyword match (only if a phone keyword was hit) → +4 each (cap at 2 = +8)
 *  - Negative keyword present → ×0 (drop the item)
 *
 * Tiered relevance:
 *  - score ≥ 5 → strong match (preferred)
 *  - score ≥ 3 → weak match (single phone mention, used to fill remaining slots)
 */
function relevanceScore(item: RawItem): number {
  const text = `${item.title} ${item.preview}`;

  // Hard exclude: generic telecom infrastructure
  for (const neg of NEGATIVE_KEYWORDS) {
    if (text.includes(neg)) return 0;
  }

  let score = 0;

  for (const kw of STRONG_KEYWORDS) {
    if (text.includes(kw)) score += 15;
  }

  let phoneHits = 0;
  for (const kw of PHONE_KEYWORDS) {
    if (text.includes(kw)) phoneHits += 1;
  }
  score += Math.min(phoneHits, 2) * 3;

  if (phoneHits > 0) {
    let tradeHits = 0;
    for (const kw of TRADE_KEYWORDS) {
      if (text.includes(kw)) tradeHits += 1;
    }
    score += Math.min(tradeHits, 2) * 4;
  }

  return score;
}

type OgMeta = { image: string | null; description: string | null };

/**
 * Best-effort scrape of og:image and og:description from a real article URL.
 * Used as fallback when the RSS feed doesn't supply media:content or a
 * description (e.g. 한국경제 RSS only ships title + link + author).
 */
async function extractOgMeta(url: string): Promise<OgMeta> {
  const empty: OgMeta = { image: null, description: null };
  try {
    const res = await fetch(url, {
      next: { tags: ['news'], revalidate: 86400 },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return empty;
    const html = await res.text();

    const findMeta = (key: 'image' | 'description'): string | null => {
      const patterns =
        key === 'image'
          ? [
              /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
              /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
              /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
            ]
          : [
              /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
              /<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i,
              /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
              /<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i,
            ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m && m[1]) return m[1];
      }
      return null;
    };

    let image = findMeta('image');
    if (image && /google|gstatic|googleusercontent\.com.*=s\d+/i.test(image)) {
      image = null;
    }
    const description = findMeta('description');
    return { image, description };
  } catch {
    return empty;
  }
}

/**
 * Decode common HTML entities found in og:description / og:image og:title
 * meta tags. Korean news sites use a mix of:
 *   - Named entities: &amp; &lt; &gt; &quot; &apos; &nbsp;
 *   - Decimal numeric: &#39; &#039; &#8217; &#8221;
 *   - Hex numeric:     &#x27; &#x2019;
 *
 * The decimal/hex regexes cover any code point including leading-zero forms,
 * so we don't need a hand-rolled list of every entity number.
 */
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Decimal numeric entities, e.g. &#039; → '
    .replace(/&#(\d+);/g, (_, num) => {
      try {
        return String.fromCodePoint(parseInt(num, 10));
      } catch {
        return '';
      }
    })
    // Hex numeric entities, e.g. &#x27; → '
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return '';
      }
    });
}

function dedupeByLink(items: RawItem[]): RawItem[] {
  const seen = new Set<string>();
  const out: RawItem[] = [];
  for (const item of items) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    out.push(item);
  }
  return out;
}

// Threshold = 3 means "at least 1 phone keyword in title/preview".
// Strong matches (score 6+) naturally rank above weak ones (score 3).
// NEG keywords still drop items to score 0 — telecom infra is filtered out.
const WEAK_THRESHOLD = 3;

export async function getLatestNews(): Promise<NewsItem[]> {
  const allItems = (await Promise.all(SOURCES.map(fetchFeed))).flat();
  if (allItems.length === 0) return [];

  const unique = dedupeByLink(allItems);

  // Score & rank: strong matches first, then by recency.
  const scored = unique
    .map((item) => ({ item, score: relevanceScore(item) }))
    .filter((entry) => entry.score > 0);

  const relevant = scored
    .filter((entry) => entry.score >= WEAK_THRESHOLD)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.item.pubDate - a.item.pubDate;
    })
    .slice(0, 3)
    .map((entry) => entry.item);

  // If fewer than 3 relevant items, fill remaining slots with most recent articles.
  if (relevant.length < 3) {
    const usedLinks = new Set(relevant.map((r) => r.link));
    const recents = unique
      .filter((item) => !usedLinks.has(item.link) && relevanceScore(item) >= 0)
      .sort((a, b) => b.pubDate - a.pubDate)
      .slice(0, 3 - relevant.length);
    relevant.push(...recents);
  }

  const ranked = relevant;
  if (ranked.length === 0) return [];

  // For each chosen item, hit the article URL once and grab og:image + og:description.
  // This covers both missing thumbnails AND missing previews (한국경제 RSS, etc.)
  // in a single round-trip per article.
  const ogMetas = await Promise.all(
    ranked.map((item) => {
      // Skip the round-trip if the feed already gave us both an image and a usable preview.
      if (item.mediaImage && item.preview) {
        return Promise.resolve<OgMeta>({ image: item.mediaImage, description: null });
      }
      return extractOgMeta(item.link);
    }),
  );

  return ranked.map((item, index) => {
    const og = ogMetas[index];
    let preview = item.preview;
    if (!preview && og.description) {
      const decoded = decodeHtmlEntities(og.description).trim();
      preview = decoded.length > 130 ? decoded.slice(0, 130) + '...' : decoded;
    }
    return {
      id: index,
      title: item.title || '산업 동향 뉴스',
      date: item.pubDate
        ? new Date(item.pubDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '최근',
      image: og.image ?? item.mediaImage ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
      preview,
      link: item.link,
      source: item.source,
      sourceName: prettySourceName(item.source, item.link),
    };
  });
}

