import { NextRequest, NextResponse } from 'next/server';
import { removeSubscriber, isValidEmail } from '@/lib/newsletter/subscribers';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email || !isValidEmail(email)) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribe - IMEC Radar</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
            .card { background: white; padding: 40px; border-radius: 8px; text-align: center; max-width: 400px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            h1 { color: #1a1a2e; margin: 0 0 16px 0; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Invalid Link</h1>
            <p>This unsubscribe link appears to be invalid or expired.</p>
          </div>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  const removed = await removeSubscriber(email);

  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Unsubscribed - IMEC Radar</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
          .card { background: white; padding: 40px; border-radius: 8px; text-align: center; max-width: 400px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          h1 { color: #1a1a2e; margin: 0 0 16px 0; }
          p { color: #666; }
          .success { color: #22c55e; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="success">Unsubscribed</h1>
          <p>${removed ? 'You have been successfully unsubscribed from IMEC Radar Daily.' : 'This email was not found in our subscriber list.'}</p>
        </div>
      </body>
    </html>
    `,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}

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

    const removed = await removeSubscriber(email);

    return NextResponse.json({
      success: true,
      removed,
      message: removed ? 'Successfully unsubscribed' : 'Email not found',
    });
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
