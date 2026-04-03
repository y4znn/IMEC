export interface ParsedIntelArticle {
  id: string;
  title: string;
  score: number;
  geographic: string;
  pillars: string;
  snippet: string;
  url?: string;
  category?: string;
  summary?: string;
  publisher?: string;
}

export interface EnrichedArticle {
  id: string;
  title: string;
  score: number;
  url: string;
  category: string;
  summary: string;
  publisher: string;
  snippet: string;
}

export interface SourceEntry {
  id: string;
  title: string;
  url: string;
  category: string;
  summary: string;
  date: string;
  publisher: string;
}

export interface Subscriber {
  email: string;
  subscribedAt: string;
  confirmed: boolean;
}

export interface NewsletterData {
  date: string;
  leadStory: EnrichedArticle;
  briefingArticles: EnrichedArticle[];
}
