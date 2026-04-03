'use client';

import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Subscribed successfully');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong');
    }
  };

  return (
    <div className="w-full">
      <p className="text-[11px] font-mono tracking-widest uppercase text-gray-500 mb-2">
        Daily Intelligence Briefing
      </p>

      {status === 'success' ? (
        <p className="text-sm font-serif text-gray-700">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={status === 'loading'}
            className="flex-1 px-3 py-2 text-sm font-serif bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 text-[11px] font-mono tracking-widest uppercase bg-gray-900 text-white border border-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Joining...' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="mt-2 text-sm font-serif text-red-600">{message}</p>
      )}
    </div>
  );
}
