'use client';

import IntelligencePulse from '@/components/IntelligencePulse';

export default function GeoeconomicIntelligenceTerminal() {
    return (
        <div className="w-full min-h-screen bg-gray-50 font-serif text-gray-900 pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-4 md:px-12 flex flex-col items-center">
                
                {/* ── Section Title: Master Corridor Identifier ── */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
                    <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tighter uppercase leading-none mb-4">
                        India Middle East Europe Economic Corridor Radar
                    </h1>
                </div>

                {/* ── Daily Intelligence Brief ── */}
                <div className="mb-16 flex justify-center w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-forwards">
                    <IntelligencePulse />
                </div>
            </div>
        </div>
    );
}
