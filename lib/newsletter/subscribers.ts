import fs from 'fs/promises';
import path from 'path';
import type { Subscriber } from './types';

const SUBSCRIBERS_PATH = path.join(process.cwd(), 'data/subscribers.json');

interface SubscribersData {
  subscribers: Subscriber[];
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(SUBSCRIBERS_PATH);
  } catch {
    // File doesn't exist, try to create it (may fail on read-only FS like Vercel)
    try {
      await fs.mkdir(path.dirname(SUBSCRIBERS_PATH), { recursive: true });
      await fs.writeFile(SUBSCRIBERS_PATH, JSON.stringify({ subscribers: [] }, null, 2));
    } catch (writeErr) {
      console.warn(`[Subscribers] Cannot create file (expected in serverless): ${writeErr}`);
      // Continue without file - readData will handle this gracefully
    }
  }
}

async function readData(): Promise<SubscribersData> {
  await ensureFile();
  try {
    const content = await fs.readFile(SUBSCRIBERS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    // File doesn't exist or can't be read (serverless) - return empty data
    return { subscribers: [] };
  }
}

async function writeData(data: SubscribersData): Promise<void> {
  try {
    await fs.writeFile(SUBSCRIBERS_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    // Resilience: If disk is read-only (e.g. Vercel), log to console and continue.
    console.warn(`[Subscribers] Disk write blocked (expected in serverless): ${err}`);
  }
}

/**
 * Get all confirmed subscriber emails
 */
export async function getSubscribers(): Promise<string[]> {
  const data = await readData();
  return data.subscribers
    .filter(s => s.confirmed)
    .map(s => s.email);
}

/**
 * Get all subscribers (including unconfirmed)
 */
export async function getAllSubscribers(): Promise<Subscriber[]> {
  const data = await readData();
  return data.subscribers;
}

/**
 * Add a new subscriber
 */
export async function addSubscriber(email: string): Promise<{ success: boolean; existing: boolean }> {
  const data = await readData();
  const existing = data.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    return { success: true, existing: true };
  }

  data.subscribers.push({
    email: email.toLowerCase(),
    subscribedAt: new Date().toISOString(),
    confirmed: true, // Auto-confirm for MVP
  });

  await writeData(data);
  return { success: true, existing: false };
}

/**
 * Remove a subscriber
 */
export async function removeSubscriber(email: string): Promise<boolean> {
  const data = await readData();
  const initialLength = data.subscribers.length;

  data.subscribers = data.subscribers.filter(
    s => s.email.toLowerCase() !== email.toLowerCase()
  );

  if (data.subscribers.length < initialLength) {
    await writeData(data);
    return true;
  }

  return false;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
