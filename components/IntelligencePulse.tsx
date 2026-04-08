'use client';

import { useState } from 'react';

export default function IntelligencePulse() {
    const [email, setEmail] = useState('');
    const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [subMessage, setSubMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSubStatus('loading');

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubStatus('success');
                setSubMessage(data.message || 'Subscribed. Briefing scheduled.');
                setEmail('');
            } else {
                setSubStatus('error');
                setSubMessage(data.error || 'Subscription failed');
            }
        } catch {
            setSubStatus('error');
            setSubMessage('Network error');
        }
    };

    return (
        <div className="relative z-50 w-full max-w-[420px] mx-auto bg-white border border-gray-200 rounded-none p-8 shadow-sm hover:shadow-md transition-all text-left animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
            {/* ── Subscription Module Section ── */}
            <div>
                <h3 className="text-sm font-sans font-bold text-gray-900 tracking-tight uppercase mb-4">
                    Daily Intelligence Briefing
                </h3>

                {subStatus === 'success' ? (
                    <div className="py-3 px-4 bg-gray-50 border border-gray-100">
                        <p className="text-[11px] font-mono tracking-widest text-gray-900 uppercase">
                            [ {subMessage} ]
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ENTER YOUR EMAIL"
                                required
                                disabled={subStatus === 'loading'}
                                className="w-full px-4 py-3 text-xs font-mono tracking-widest bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white transition-all disabled:opacity-50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={subStatus === 'loading'}
                            className="w-full py-3.5 bg-gray-900 text-white font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:opacity-50"
                        >
                            {subStatus === 'loading' ? 'PROCESSING...' : 'SUBSCRIBE'}
                        </button>
                    </form>
                )}

                {subStatus === 'error' && (
                    <p className="mt-3 text-[10px] font-mono text-red-500 uppercase tracking-widest">
                        ERROR: {subMessage}
                    </p>
                )}
            </div>
        </div>
    );
}
