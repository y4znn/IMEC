'use client';

import { useState, useMemo, useEffect } from 'react';
import { ExternalLink, BookOpen, Search } from 'lucide-react';
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

export default function SourcesPage() {
    const [activeCategory, setActiveCategory] = useState<string>('Foundations & Architecture');
    const [sources, setSources] = useState<AcademicSource[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch data safely
    useEffect(() => {
        fetch('/data/sources.json')
            .then(res => res.json())
            .then(data => setSources(data))
            .catch(() => {
                console.warn("Failed to fetch sources.json, using fallback.");
                setSources(fallbackSources as any as AcademicSource[]);
            });
    }, []);

    // Get unique categories sorted to preserve a logical read order
    const categories = useMemo(() => {
        const cats = Array.from(new Set(sources.map(s => s.category)));
        // Hardcode order based on script to maintain narrative flow
        const order = [
            'Foundations & Architecture',
            'Geopolitics & Rival Corridors (BRI)',
            'Infrastructure: Digital & Energy',
            'Regional Shocks & Conflicts'
        ];
        return cats.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }, [sources]);

    // Remove the redundant generic useEffect trying to patch state.
    // Instead merely fallback in the activeSources computation:
    const finalCategory = (!categories.includes(activeCategory) && categories.length > 0) ? categories[0] : activeCategory;

    const activeSources = useMemo(() => {
        let filtered = sources.filter(s => s.category === finalCategory);
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s => 
                (s.title || '').toLowerCase().includes(query) || 
                (s.publisher || '').toLowerCase().includes(query) || 
                (s.summary || '').toLowerCase().includes(query)
            );
        }
        
        return filtered;
    }, [sources, finalCategory, searchQuery]);

    return (
        <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] pt-16 bg-gray-50 font-serif text-gray-900">

            {/* ── LEFT SIDEBAR: Syllabus Modules ── */}
            <div className="w-full md:w-[380px] shrink-0 border-b md:border-b-0 md:border-r border-gray-300 md:h-full overflow-y-auto custom-scrollbar flex flex-col">
                <div className="px-4 md:px-8 py-6 md:py-10 border-b border-gray-300 bg-gray-50 sticky top-0 z-10 rounded-none">
                    <h1 className="text-2xl md:text-3xl font-sans font-bold tracking-tight uppercase leading-none mb-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
                        Sources
                    </h1>
                    <p className="text-[10px] text-gray-900/50 tracking-[0.2em] font-mono uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-forwards">
                        [{sources.length}] Verified References
                    </p>
                </div>

                <nav className="flex flex-row md:flex-col flex-1 p-3 md:p-4 gap-2 overflow-x-auto md:overflow-x-visible">
                    {categories.map((cat, idx) => {
                        const isActive = activeCategory === cat;
                        const catSourcesCount = sources.filter(s => s.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex flex-col items-start px-3 md:px-5 py-3 md:py-4 text-left transition-colors cursor-pointer border rounded-none min-w-[160px] md:min-w-0 shrink-0 md:shrink ${isActive
                                    ? 'bg-white text-black border-gray-300'
                                    : 'bg-gray-50 text-gray-900/60 border-transparent hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2 w-full">
                                    <span className={`text-[10px] tracking-widest font-mono font-bold ${isActive ? 'text-black/50' : 'text-gray-900/30'}`}>
                                        MODULE 0{idx + 1}
                                    </span>
                                    <div className={`h-[1px] flex-1 ${isActive ? 'bg-gray-50/10' : 'bg-white/10'} hidden md:block`} />
                                    <span className={`text-[10px] tracking-widest font-mono ${isActive ? 'text-black' : 'text-gray-900'}`}>
                                        {catSourcesCount}
                                    </span>
                                </div>
                                <span className={`text-xs md:text-sm tracking-tight font-bold leading-snug ${isActive ? 'text-black' : 'text-gray-900'}`}>
                                    {cat}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* ── RIGHT PANEL: Source Content (Scrollable) ── */}
            <div className="flex-1 md:h-full overflow-y-auto custom-scrollbar bg-gray-50 relative">
                <div className="max-w-4xl mx-auto px-4 md:px-12 py-6 md:py-10">

                    {/* Header for Category */}
                    <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <div className="text-[10px] text-gray-900/50 tracking-[0.3em] font-mono uppercase mb-3 md:mb-4 flex items-center gap-3">
                                <BookOpen className="w-3 h-3" />
                                Active Sources Module
                            </div>
                            <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-none">
                                {activeCategory}
                            </h2>
                        </div>
                        <div className="shrink-0">
                            <IntelligencePulse />
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-8">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search specific intelligence, publisher, or keywords..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 sm:text-sm font-sans"
                            />
                        </div>
                    </div>

                    {/* Source List */}
                    <div className="flex flex-col gap-4 md:gap-6">
                        {activeSources.map(src => (
                            <div
                                key={src.id}
                                className="group relative border border-gray-300 bg-white p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-default"
                            >
                                <div className="pr-0 md:pr-32">
                                    {src.publisher && (
                                        <p className="font-serif text-sm md:text-base text-gray-800 mb-2">
                                            {src.publisher}
                                        </p>
                                    )}
                                    <h3 className="text-xs md:text-sm font-mono text-gray-900 mb-3 leading-relaxed">
                                        {src.title}
                                    </h3>
                                    <p className="text-xs md:text-sm font-serif text-gray-600 leading-relaxed mb-4 line-clamp-3">
                                        {src.summary}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[9px] md:text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-4 md:mb-0">
                                        <span>REF: {src.id}</span>
                                        <span className="w-1 h-1 bg-gray-300" />
                                        <span>CY {src.date}</span>
                                    </div>
                                </div>

                                {/* Access button - static on mobile, absolute on desktop */}
                                <div className="md:absolute md:top-6 md:right-6">
                                    <a
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-900 font-mono text-[10px] tracking-widest uppercase hover:bg-gray-100 hover:border-black transition-all w-full md:w-auto"
                                    >
                                        [ ACCESS ]
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        ))}

                        {activeSources.length === 0 && (
                            <div className="text-sm text-gray-900/40 font-mono uppercase tracking-widest p-6 md:p-8 border border-gray-400/5">
                                Loading repository records...
                            </div>
                        )}
                    </div>

                    <div className="h-10 md:h-20" /> {/* Bottom padding */}
                </div>
            </div>

        </div>
    );
}
