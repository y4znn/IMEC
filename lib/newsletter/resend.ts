import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('RESEND_API_KEY is missing from environment variables');
}

export const resend = apiKey ? new Resend(apiKey) : null as any;
