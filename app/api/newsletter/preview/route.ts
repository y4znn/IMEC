import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import { getNewsletterData } from '@/lib/newsletter/parseIntel';
import { DailyNewsletter } from '@/lib/email/templates/DailyNewsletter';

export async function GET() {
  try {
    const { leadStory, briefingArticles } = await getNewsletterData(7);

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = await render(
      DailyNewsletter({
        date: today,
        leadStory,
        briefingArticles,
        unsubscribeUrl: '#preview',
      })
    );

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Newsletter Preview] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate newsletter preview' },
      { status: 500 }
    );
  }
}
