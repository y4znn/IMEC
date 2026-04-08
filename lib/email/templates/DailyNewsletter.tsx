import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Preview,
  Font,
} from '@react-email/components';
import type { EnrichedArticle } from '../../newsletter/types';

interface DailyNewsletterProps {
  date: string;
  leadStory: EnrichedArticle;
  briefingArticles: EnrichedArticle[];
  unsubscribeUrl?: string;
}

const styles = {
  body: {
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    maxWidth: '600px',
  },
  header: {
    backgroundColor: '#1a1a2e',
    padding: '24px 32px',
  },
  logoText: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700' as const,
    letterSpacing: '2px',
    margin: 0,
  },
  dateText: {
    color: '#8b8b9e',
    fontSize: '14px',
    margin: '8px 0 0 0',
  },
  content: {
    padding: '32px',
  },
  sectionLabel: {
    color: '#4b98f5',
    fontSize: '11px',
    fontWeight: '600' as const,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    margin: '0 0 16px 0',
  },
  leadHeadline: {
    color: '#1a1a2e',
    fontSize: '22px',
    fontWeight: '700' as const,
    lineHeight: '1.3',
    margin: '0 0 8px 0',
  },
  leadMeta: {
    color: '#666666',
    fontSize: '12px',
    margin: '0 0 12px 0',
  },
  leadSummary: {
    color: '#333333',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  readMore: {
    color: '#4b98f5',
    fontSize: '14px',
    fontWeight: '600' as const,
    textDecoration: 'none',
  },
  divider: {
    borderColor: '#e5e5e5',
    borderTop: '1px solid #e5e5e5',
    margin: '24px 0',
  },
  briefingItem: {
    marginBottom: '20px',
  },
  briefingHeadline: {
    color: '#1a1a2e',
    fontSize: '16px',
    fontWeight: '600' as const,
    lineHeight: '1.4',
    textDecoration: 'none',
  },
  briefingPublisher: {
    color: '#888888',
    fontSize: '12px',
    margin: '4px 0',
  },
  briefingSummary: {
    color: '#555555',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '4px 0 0 0',
  },
  footer: {
    backgroundColor: '#f9f9f9',
    borderTop: '1px solid #e5e5e5',
    padding: '24px 32px',
    textAlign: 'center' as const,
  },
  footerBrand: {
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0 0 4px 0',
  },
  footerTagline: {
    color: '#888888',
    fontSize: '12px',
    margin: '0 0 12px 0',
  },
  unsubscribe: {
    color: '#888888',
    fontSize: '12px',
    textDecoration: 'underline',
  },
};

function truncateSummary(summary: string, maxLength: number): string {
  if (summary.length <= maxLength) return summary;
  return summary.slice(0, maxLength).trim() + '...';
}

export function DailyNewsletter({
  date,
  leadStory,
  briefingArticles,
  unsubscribeUrl = '#',
}: DailyNewsletterProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Georgia"
          fallbackFontFamily="serif"
        />
      </Head>
      <Preview>IMEC Radar Daily Intelligence Briefing - {date}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logoText}>IMEC RADAR</Text>
            <Text style={styles.dateText}>{date}</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            {/* Lead Story */}
            <Text style={styles.sectionLabel}>Today&apos;s Lead Story</Text>
            <Link href={leadStory.url} style={{ textDecoration: 'none' }}>
              <Text style={styles.leadHeadline}>{leadStory.title}</Text>
            </Link>
            <Text style={styles.leadMeta}>
              {leadStory.category} | {leadStory.publisher}
            </Text>
            <Text style={styles.leadSummary}>
              {truncateSummary(leadStory.summary, 280)}
            </Text>
            <Link href={leadStory.url} style={styles.readMore}>
              Read Full Analysis →
            </Link>

            <Hr style={styles.divider} />

            {/* Intelligence Briefing */}
            <Text style={styles.sectionLabel}>Intelligence Briefing</Text>

            {briefingArticles.map((article, index) => (
              <Section key={article.id || index} style={styles.briefingItem}>
                <Link href={article.url} style={styles.briefingHeadline}>
                  {article.title}
                </Link>
                <Text style={styles.briefingPublisher}>
                  {article.publisher}
                </Text>
                <Text style={styles.briefingSummary}>
                  {truncateSummary(article.summary, 120)}
                </Text>
              </Section>
            ))}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerBrand}>IMEC Radar</Text>
            <Text style={styles.footerTagline}>
              India-Middle East-Europe Economic Corridor Research Platform
            </Text>
            <Link href={unsubscribeUrl} style={styles.unsubscribe}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default DailyNewsletter;
