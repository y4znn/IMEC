import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import { addSubscriber, isValidEmail } from '@/lib/newsletter/subscribers';
import { getNewsletterData } from '@/lib/newsletter/parseIntel';
import { DailyNewsletter } from '@/lib/email/templates/DailyNewsletter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // 1. Audit locally (resilient to read-only FS)
    const result = await addSubscriber(email);

    if (result.existing) {
      return NextResponse.json({
        success: true,
        message: 'Already subscribed',
      });
    }

    // 2. Send Welcome Briefing via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { leadStory, briefingArticles } = await getNewsletterData(3);
        const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || 'onboarding@resend.dev';
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
        
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
            unsubscribeUrl,
          })
        );

        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Welcome to IMEC Radar Daily Briefing',
          html,
        });

        console.log(`[Subscribe] Welcome email sent to ${email}`);
      } catch (resendError) {
        console.error('[Subscribe] Resend error (continuing):', resendError);
        // We continue because the user is successfully added to the local audit/potential queue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to IMEC Radar Daily',
    });
  } catch (error) {
    console.error('[Subscribe] Global Error:', error);
    return NextResponse.json(
      { error: 'Subscription service unavailable' },
      { status: 500 }
    );
  }
}
