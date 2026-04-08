'use client';

import { useState, useMemo, useEffect } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import fallbackSources from '@/public/data/sources.json';
import IntelligencePulse from '@/components/IntelligencePulse';

type AcademicSource = {
    id: string;
    title: string;
    summary: string;
    url: string;
    category: string;
    date: string;
    publisher?: string;
};

export default function GeoeconomicIntelligenceTerminal() {
    const [sources, setSources] = useState<AcademicSource[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch data safely
    useEffect(() => {
        fetch('/data/sources.json')
            .then(res => res.json())
            .then(data => {
                // Sort chronologically: newest first
                const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
                setSources(sorted);
            })
            .catch(() => {
                console.warn("Failed to fetch sources.json, using fallback.");
                const sortedFallback = [...fallbackSources].sort((a: AcademicSource, b: AcademicSource) => b.date.localeCompare(a.date));
                setSources(sortedFallback);
            });
    }, []);

    const activeSources = useMemo(() => {
        let filtered = sources;
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                (s.title || '').toLowerCase().includes(query) || 
                (s.publisher || '').toLowerCase().includes(query) || 
                (s.summary || '').toLowerCase().includes(query)
            );
        }
        
        return filtered;
    }, [sources, searchQuery]);

    return (
        <div className="w-full min-h-screen bg-gray-50 font-serif text-gray-900 pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-4 md:px-12 flex flex-col items-center">
                
                {/* ── Section Title: Master Corridor Identifier ── */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
                    <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tighter uppercase leading-none mb-4">
                        India Middle East Europe Economic Corridor
                    </h1>
                    <p className="text-[11px] text-gray-900/40 tracking-[0.3em] font-mono uppercase">
                        [{sources.length}] Verified Sources
                    </p>
                </div>

                {/* ── Daily Intelligence Briefing ── */}
                <div className="mb-16 flex justify-center w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-forwards">
                    <IntelligencePulse />
                </div>

                {/* ── Search Bar ── */}
                <div className="w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-forwards">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter documentation, publishers, or infrastructure keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 sm:text-sm font-sans"
                        />
                    </div>
                </div>

                {/* ── Source List ── */}
                <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400 fill-mode-forwards">
                    {activeSources.map(src => (
                        <div
                            key={src.id}
                            className="group relative border border-gray-200 bg-white p-6 md:p-8 hover:bg-gray-50 transition-all cursor-default"
                        >
                            <div className="md:pr-40">
                                {src.publisher && (
                                    <p className="font-serif text-base text-gray-800 mb-3">
                                        {src.publisher}
                                    </p>
                                )}
                                <h3 className="text-sm font-mono text-gray-900 mb-4 leading-relaxed font-bold">
                                    {src.title}
                                </h3>
                                <p className="text-sm font-serif text-gray-600 leading-relaxed mb-6">
                                    {src.summary}
                                </p>
                                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                                    <span>REF: {src.id}</span>
                                    <span className="w-1 h-1 bg-gray-200" />
                                    <span>CY {src.date}</span>
                                </div>
                            </div>

                            <div className="mt-6 md:mt-0 md:absolute md:top-8 md:right-8">
                                <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 bg-white text-gray-900 font-mono text-[10px] tracking-widest uppercase hover:bg-black hover:text-white hover:border-black transition-all w-full md:w-auto"
                                >
                                    ACCESS
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    ))}

                    {activeSources.length === 0 && sources.length > 0 && (
                        <div className="text-center py-20 text-sm text-gray-400 font-mono uppercase tracking-[0.2em]">
                            No matching intelligence found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
