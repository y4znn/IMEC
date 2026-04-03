'use client';

import { useState, useEffect } from 'react';

type PulseConfig = {
    total_indexed: number;
    verified_sources: number;
    today_added: number;
    last_harvest: string;
    status: string;
};

export default function IntelligencePulse() {
    const [pulse, setPulse] = useState<PulseConfig | null>(null);
    const [email, setEmail] = useState('');
    const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [subMessage, setSubMessage] = useState('');

    useEffect(() => {
        fetch('/data/pulse_config.json')
            .then(res => res.json())
            .then(setPulse)
            .catch(() => {}); // fall back to hardcoded
    }, []);

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

    const displayCount = pulse
        ? `${(pulse.total_indexed + pulse.verified_sources).toLocaleString()}+ online sources`
        : '11,300,000+ online sources';

    return (
        <div className="relative z-50 w-full max-w-[420px] mx-auto bg-white border border-gray-200 rounded-none p-8 shadow-sm hover:shadow-md transition-all text-left animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
            {/* ── Intelligence Pulse Section ── */}
            <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center justify-between w-full text-lg font-sans font-bold text-gray-900 tracking-tight leading-none uppercase">
                    {displayCount}
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                </div>
                <div className="text-[11px] text-gray-400 font-sans tracking-widest leading-tight uppercase font-medium">
                    on India Middle East Europe Economic Corridor
                </div>
            </div>

            {/* ── Subscription Module Section ── */}
            <div className="pt-8 border-t border-gray-100">
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
