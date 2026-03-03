'use client';

import { useState, useMemo, useEffect } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';
import fallbackSources from '@/public/data/sources.json';

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
        return sources.filter(s => s.category === finalCategory);
    }, [sources, finalCategory]);

    return (
        <div className="flex w-full h-[calc(100vh-64px)] pt-16 bg-gray-50 font-serif text-gray-900">

            {/* ── LEFT SIDEBAR: Syllabus Modules ── */}
            <div className="w-[380px] shrink-0 border-r border-gray-300 h-full overflow-y-auto custom-scrollbar flex flex-col">
                <div className="px-8 py-10 border-b border-gray-300 bg-gray-50 sticky top-0 z-10 rounded-none">
                    <h1 className="text-3xl font-bold tracking-tight uppercase leading-none mb-3">
                        Intel<br />Syllabus
                    </h1>
                    <p className="text-[10px] text-gray-900/50 tracking-[0.2em] font-mono uppercase">
                        Comprehensive Source Index:<br />
                        [{sources.length}] Verified References
                    </p>
                </div>

                <nav className="flex flex-col flex-1 p-4 gap-2">
                    {categories.map((cat, idx) => {
                        const isActive = activeCategory === cat;
                        const catSourcesCount = sources.filter(s => s.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex flex-col items-start px-5 py-4 text-left transition-colors cursor-pointer border rounded-none ${isActive
                                    ? 'bg-white text-black border-gray-300'
                                    : 'bg-gray-50 text-gray-900/60 border-transparent hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2 w-full">
                                    <span className={`text-[10px] tracking-widest font-mono font-bold ${isActive ? 'text-black/50' : 'text-gray-900/30'}`}>
                                        MODULE 0{idx + 1}
                                    </span>
                                    <div className={`h-[1px] flex-1 ${isActive ? 'bg-gray-50/10' : 'bg-white/10'}`} />
                                    <span className={`text-[10px] tracking-widest font-mono ${isActive ? 'text-black' : 'text-gray-900'}`}>
                                        {catSourcesCount}
                                    </span>
                                </div>
                                <span className={`text-sm tracking-tight font-bold leading-snug ${isActive ? 'text-black' : 'text-gray-900'}`}>
                                    {cat}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* ── RIGHT PANEL: Source Content (Scrollable) ── */}
            <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-gray-50 relative">
                <div className="max-w-4xl mx-auto px-12 py-10">

                    {/* Header for Category */}
                    <div className="mb-12">
                        <div className="text-[10px] text-gray-900/50 tracking-[0.3em] font-mono uppercase mb-4 flex items-center gap-3">
                            <BookOpen className="w-3 h-3" />
                            Active Module Syllabus
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight leading-none">
                            {activeCategory}
                        </h2>
                    </div>

                    {/* Source List */}
                    <div className="flex flex-col gap-6">
                        {activeSources.map(src => (
                            <div
                                key={src.id}
                                className="group relative border border-gray-300 bg-white p-6 hover:bg-gray-50 transition-colors cursor-default"
                            >
                                <div className="pr-32">
                                    {src.publisher && (
                                        <p className="font-serif text-base text-gray-800 mb-2">
                                            {src.publisher}
                                        </p>
                                    )}
                                    <h3 className="text-sm font-mono text-gray-900 mb-3 leading-relaxed">
                                        {src.title}
                                    </h3>
                                    <p className="text-sm font-serif text-gray-600 leading-relaxed mb-4 line-clamp-3">
                                        {src.summary}
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                                        <span>REF: {src.id}</span>
                                        <span className="w-1 h-1 bg-gray-300" />
                                        <span>CY {src.date}</span>
                                    </div>
                                </div>

                                <div className="absolute top-6 right-6">
                                    <a
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-900 font-mono text-[10px] tracking-widest uppercase hover:bg-gray-100 hover:border-black transition-all"
                                    >
                                        [ ACCESS ]
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        ))}

                        {activeSources.length === 0 && (
                            <div className="text-sm text-gray-900/40 font-mono uppercase tracking-widest p-8 border border-gray-400/5">
                                Loading repository records...
                            </div>
                        )}
                    </div>

                    <div className="h-20" /> {/* Bottom padding */}
                </div>
            </div>

        </div>
    );
}
