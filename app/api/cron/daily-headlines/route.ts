import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import { DailyNewsletter } from '@/lib/email/templates/DailyNewsletter';
import { getSubscribers } from '@/lib/newsletter/subscribers';
import type { EnrichedArticle } from '@/lib/newsletter/types';

/* ── GNews Configuration ── */
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';
const GNEWS_BASE = 'https://gnews.io/api/v4/search';

const SEARCH_QUERIES = [
  'IMEC corridor India Middle East',
  'India Middle East Europe trade',
  'Suez Canal shipping disruption',
  'Belt Road Initiative infrastructure',
];

interface GNewsArticle {
  title: string;
  url: string;
  publishedAt: string;
  description: string;
  source: { name: string };
}

/* ── Fallback Data ── */
const FALLBACK_ARTICLES: EnrichedArticle[] = [
  {
    id: 'fallback-1',
    title: 'The India-Middle East-Europe Economic Corridor: Strategic Analysis',
    score: 9.0,
    url: 'https://www.atlanticcouncil.org/in-depth-research-reports/report/the-india-middle-east-europe-economic-corridor-connectivity-in-an-era-of-geopolitical-uncertainty/',
    category: 'Analysis',
    summary: 'Comprehensive analysis of IMEC corridor prospects and geopolitical implications.',
    publisher: 'Atlantic Council',
    snippet: '',
  },
  {
    id: 'fallback-2',
    title: 'From hype to horizon: What the EU needs to know to bring IMEC to life',
    score: 8.5,
    url: 'https://www.iss.europa.eu/publications/briefs/hype-horizon-what-eu-needs-know-bring-imec-life',
    category: 'Policy',
    summary: 'EU perspective on implementation challenges and opportunities for the corridor.',
    publisher: 'EUISS',
    snippet: '',
  },
  {
    id: 'fallback-3',
    title: 'The infinite connection: How to make the India-Middle East-Europe economic corridor happen',
    score: 8.5,
    url: 'https://ecfr.eu/publication/the-infinite-connection-how-to-make-the-india-middle-east-europe-economic-corridor-happen/',
    category: 'Analysis',
    summary: 'European Council on Foreign Relations analysis on corridor implementation.',
    publisher: 'ECFR',
    snippet: '',
  },
];

function categorize(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('analysis') || lower.includes('study') || lower.includes('research')) return 'Analysis';
  if (lower.includes('policy') || lower.includes('agreement') || lower.includes('summit')) return 'Policy';
  if (lower.includes('opinion') || lower.includes('editorial')) return 'Opinion';
  return 'News';
}

async function fetchGNewsQuery(query: string): Promise<GNewsArticle[]> {
  const url = `${GNEWS_BASE}?q=${encodeURIComponent(query)}&max=10&lang=en&apikey=${GNEWS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GNews returned ${res.status}`);
  const data = await res.json();
  return data.articles || [];
}

async function fetchLiveHeadlines(): Promise<EnrichedArticle[]> {
  if (!GNEWS_API_KEY) {
    console.warn('[Cron] No GNEWS_API_KEY set. Using fallback data.');
    return FALLBACK_ARTICLES;
  }

  try {
    const results = await Promise.allSettled(
      SEARCH_QUERIES.map((q) => fetchGNewsQuery(q))
    );

    const allArticles: GNewsArticle[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    }

    if (allArticles.length === 0) {
      console.warn('[Cron] All GNews queries failed. Using fallback.');
      return FALLBACK_ARTICLES;
    }

    // Deduplicate by title
    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      const key = a.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date and take top 7
    unique.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const top7 = unique.slice(0, 7);

    // Transform to EnrichedArticle format
    return top7.map((article, i) => ({
      id: `gnews-${i}`,
      title: article.title,
      score: 8.0,
      url: article.url,
      category: categorize(article.title),
      summary: article.description || 'No summary available.',
      publisher: article.source?.name || 'Unknown',
      snippet: '',
    }));
  } catch (error) {
    console.error('[Cron] Error fetching headlines:', error);
    return FALLBACK_ARTICLES;
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for required env vars
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not configured' },
      { status: 500 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Fetch live headlines
    const articles = await fetchLiveHeadlines();
    const leadStory = articles[0];
    const briefingArticles = articles.slice(1);

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Get subscribers
    const subscribers = await getSubscribers();

    if (subscribers.length === 0) {
      return NextResponse.json({ message: 'No subscribers', sent: 0 });
    }

    const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || 'onboarding@resend.dev';
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://imec-radar.vercel.app';

    // Send to all subscribers
    const results = await Promise.allSettled(
      subscribers.map(async (email) => {
        const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

        const html = await render(
          DailyNewsletter({
            date: today,
            leadStory,
            briefingArticles,
            unsubscribeUrl,
          })
        );

        return resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `IMEC Radar Daily - ${today}`,
          html,
        });
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[Cron] Failed to send to ${subscribers[index]}:`, result.reason);
      }
    });

    console.log(`[Cron] Daily headlines sent: ${successful} success, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      totalSubscribers: subscribers.length,
      articlesIncluded: articles.length,
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send daily headlines', details: String(error) },
      { status: 500 }
    );
  }
}
