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

    useEffect(() => {
        fetch('/data/pulse_config.json')
            .then(res => res.json())
            .then(setPulse)
            .catch(() => {}); // fall back to hardcoded
    }, []);

    const displayCount = pulse
        ? `${(pulse.total_indexed + pulse.verified_sources).toLocaleString()}+ Results`
        : '11,300,000+ Results';

    const todayBadge = pulse?.today_added
        ? `+${pulse.today_added} today`
        : null;

    return (
        <div className="relative z-50 block animate-in fade-in slide-in-from-top-2 duration-700 fill-mode-forwards bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow text-left">
            <div className="flex flex-col gap-1">
                <div className="text-lg font-sans font-bold text-gray-900 tracking-tight leading-none">
                    11,300,000+ online sources
                </div>
                <div className="text-xs text-gray-400 font-sans mt-0.5">
                    on India Middle East Europe Economic Corridor
                </div>
            </div>
        </div>
    );
}
