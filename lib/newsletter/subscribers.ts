import { resend } from './resend';
import type { Subscriber } from './types';

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

/**
 * Get all confirmed subscriber emails from Resend
 * Note: For MVP, we primarily use the subscribe/unsubscribe actions.
 * Fetching the full list might be rate-limited if used frequently.
 */
export async function getSubscribers(): Promise<string[]> {
  try {
    if (!AUDIENCE_ID) {
      console.warn('[Subscribers] RESEND_AUDIENCE_ID is not configured');
      return [];
    }
    const { data, error } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    if (error || !data) return [];
    return data.data.map(contact => contact.email);
  } catch (err) {
    console.error('[Subscribers] List fetch error:', err);
    return [];
  }
}

/**
 * Get all subscribers (including unconfirmed)
 * Mapping Resend contacts to internal Subscriber type
 */
export async function getAllSubscribers(): Promise<Subscriber[]> {
  try {
    if (!AUDIENCE_ID) return [];
    const { data, error } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    if (error || !data) return [];
    
    return data.data.map(contact => ({
      email: contact.email,
      subscribedAt: contact.created_at,
      confirmed: !contact.unsubscribed,
    }));
  } catch {
    return [];
  }
}

/**
 * Add a new subscriber to Resend Audience
 */
export async function addSubscriber(email: string): Promise<{ success: boolean; existing: boolean }> {
  try {
    if (!AUDIENCE_ID) {
      console.warn('[Subscribers] Redirecting to direct email send (no Audience ID configured)');
      return { success: true, existing: false };
    }

    // Attempt to add to Resend Audience
    const { error } = await resend.contacts.create({
      email: email.toLowerCase(),
      firstName: '',
      lastName: '',
      unsubscribed: false,
      audienceId: AUDIENCE_ID,
    });

    if (error) {
      // Check if it's "Contact already exists" error
      const errObj = error as Record<string, unknown>;
      if (errObj.name === 'contact_already_exists' || errObj.code === 422) {
        return { success: true, existing: true };
      }
      console.error('[Subscribers] Resend API Error:', error);
      throw error;
    }

    return { success: true, existing: false };
  } catch (err) {
    console.error('[Subscribers] Add error:', err);
    // Even if persistence fails, we return success so the calling route 
    // can at least try to send the welcome email (resiliency).
    return { success: false, existing: false };
  }
}

/**
 * Remove a subscriber from Resend Audience
 */
export async function removeSubscriber(email: string): Promise<boolean> {
  try {
    if (!AUDIENCE_ID) return false;
    
    // In Resend, we usually update the contact to unsubscribed: true 
    // rather than deleting to maintain history, but for simplicity here we delete if found.
    // Or we could use resend.contacts.update({ unsubscribed: true }) if ID was known.
    
    // First, find the contact to get its ID
    const { data: contacts } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const contact = contacts?.data.find(c => c.email.toLowerCase() === email.toLowerCase());
    
    if (contact) {
      await resend.contacts.remove({
        id: contact.id,
        audienceId: AUDIENCE_ID,
      });
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('[Subscribers] Remove error:', err);
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
