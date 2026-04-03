import fs from 'fs/promises';
import path from 'path';
import type { ParsedIntelArticle, SourceEntry, EnrichedArticle } from './types';

/**
 * Parse verified_intel.md to extract scored articles
 * Format:
 * ### [live-2] Title Here
 * - **Score:** 10.0/10.0 (fast)
 * - **Geographic:** 4.0/4.0 — Strong geographic grounding: 8 nodes matched
 * - **Pillars:** 4.0/4.0 — All three pillars covered: 10 keywords
 * - **Comparative:** 2.0/2.0 — ...
 * - **Decision:** AUTO-KEEP: ...
 * - **Snippet:** _Abstract text here..._
 */
export function parseVerifiedIntel(markdown: string): ParsedIntelArticle[] {
  const articles: ParsedIntelArticle[] = [];

  // Split by article headers
  const articleBlocks = markdown.split(/(?=### \[)/);

  for (const block of articleBlocks) {
    if (!block.trim().startsWith('### [')) continue;

    // Extract ID and title
    const headerMatch = block.match(/### \[([\w-]+)\] (.+?)(?:\n|$)/);
    if (!headerMatch) continue;

    const id = headerMatch[1];
    const title = headerMatch[2].trim();

    // Extract score
    const scoreMatch = block.match(/\*\*Score:\*\* ([\d.]+)\/10\.0/);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

    // Extract geographic
    const geoMatch = block.match(/\*\*Geographic:\*\* [\d.]+\/[\d.]+ — (.+?)(?:\n|$)/);
    const geographic = geoMatch ? geoMatch[1].trim() : '';

    // Extract pillars
    const pillarsMatch = block.match(/\*\*Pillars:\*\* [\d.]+\/[\d.]+ — (.+?)(?:\n|$)/);
    const pillars = pillarsMatch ? pillarsMatch[1].trim() : '';

    // Extract snippet (use [\s\S] instead of . with s flag for compatibility)
    const snippetMatch = block.match(/\*\*Snippet:\*\* _([\s\S]+?)_/);
    const snippet = snippetMatch ? snippetMatch[1].trim() : '';

    articles.push({
      id,
      title,
      score,
      geographic,
      pillars,
      snippet
    });
  }

  return articles;
}

/**
 * Select top N articles above score threshold, sorted by score descending
 */
export function selectTopArticles(
  articles: ParsedIntelArticle[],
  options: { minScore?: number; limit?: number } = {}
): ParsedIntelArticle[] {
  const { minScore = 7.5, limit = 7 } = options;

  return articles
    .filter(a => a.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Enrich parsed articles with full data from sources.json
 */
export function enrichWithSources(
  articles: ParsedIntelArticle[],
  sources: SourceEntry[]
): EnrichedArticle[] {
  const sourceMap = new Map(sources.map(s => [s.id, s]));

  return articles.map(article => {
    const source = sourceMap.get(article.id);

    return {
      id: article.id,
      title: cleanTitle(article.title),
      score: article.score,
      url: source?.url || '',
      category: source?.category || 'Intelligence',
      summary: source?.summary || article.snippet,
      publisher: source?.publisher || extractPublisher(article.title),
      snippet: article.snippet
    };
  });
}

/**
 * Clean title by removing trailing " - Publisher" patterns
 */
function cleanTitle(title: string): string {
  // Remove common suffixes like " - Wikipedia", " - Springer", etc.
  return title.replace(/ - [^-]+$/, '').trim();
}

/**
 * Extract publisher from title if present
 */
function extractPublisher(title: string): string {
  const match = title.match(/ - ([^-]+)$/);
  return match ? match[1].trim() : 'IMEC Radar';
}

/**
 * Load and parse verified intelligence from file
 */
export async function loadVerifiedIntel(): Promise<ParsedIntelArticle[]> {
  const filePath = path.join(process.cwd(), 'public/data/verified_intel.md');
  const markdown = await fs.readFile(filePath, 'utf-8');
  return parseVerifiedIntel(markdown);
}

/**
 * Load sources.json
 */
export async function loadSources(): Promise<SourceEntry[]> {
  const filePath = path.join(process.cwd(), 'public/data/sources.json');
  const json = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(json);
}

/**
 * Get newsletter data ready for rendering
 */
export async function getNewsletterData(limit = 7): Promise<{
  leadStory: EnrichedArticle;
  briefingArticles: EnrichedArticle[];
}> {
  const articles = await loadVerifiedIntel();
  const sources = await loadSources();

  const topArticles = selectTopArticles(articles, { minScore: 7.5, limit });
  const enriched = enrichWithSources(topArticles, sources);

  if (enriched.length === 0) {
    throw new Error('No articles found above score threshold');
  }

  return {
    leadStory: enriched[0],
    briefingArticles: enriched.slice(1)
  };
}
