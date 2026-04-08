import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import { getNewsletterData } from '@/lib/newsletter/parseIntel';
import { DailyNewsletter } from '@/lib/email/templates/DailyNewsletter';
import { getSubscribers } from '@/lib/newsletter/subscribers';

export async function POST(request: NextRequest) {
  // Simple auth check
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.NEWSLETTER_SECRET}`;

  if (!process.env.NEWSLETTER_SECRET || authHeader !== expectedAuth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check for required env vars first
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not configured' },
      { status: 500 }
    );
  }

  // Initialize Resend client (lazy initialization to avoid build-time errors)
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (!resend) {
    return NextResponse.json({ error: 'Resend not initialized' }, { status: 500 });
  }

  try {
    // Get newsletter content
    const { leadStory, briefingArticles } = await getNewsletterData(7);

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Get subscribers
    const subscribers = await getSubscribers();

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers found' },
        { status: 400 }
      );
    }

    const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || 'onboarding@resend.dev';
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

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

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[Newsletter] Failed to send to ${subscribers[index]}:`, result.reason);
      }
    });

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      totalSubscribers: subscribers.length,
      articlesIncluded: 1 + briefingArticles.length,
    });
  } catch (error) {
    console.error('[Newsletter] Send error:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter', details: String(error) },
      { status: 500 }
    );
  }
}
