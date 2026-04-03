import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, isValidEmail } from '@/lib/newsletter/subscribers';

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

    const result = await addSubscriber(email);

    if (result.existing) {
      return NextResponse.json({
        success: true,
        message: 'Already subscribed',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to IMEC Radar Daily',
    });
  } catch (error) {
    console.error('[Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
