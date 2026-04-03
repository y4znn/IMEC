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
        ? `${(pulse.total_indexed + pulse.verified_sources).toLocaleString()}+ online sources`
        : '11,300,000+ online sources';

    return (
        <div className="relative z-50 w-72 mx-auto bg-white border border-gray-200 rounded-none px-5 py-4 shadow-sm hover:shadow-md transition-all text-left animate-in fade-in slide-in-from-bottom-2 duration-1000 fill-mode-forwards">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between w-full text-base font-sans font-bold text-gray-900 tracking-tight leading-none uppercase">
                    {displayCount}
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                </div>
                <div className="text-[10px] text-gray-400 font-sans tracking-wide leading-tight">
                    on India Middle East Europe Economic Corridor
                </div>
            </div>
        </div>
    );
}
