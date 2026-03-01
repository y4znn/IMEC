'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import fallbackSources from '@/public/data/sources.json';

// Shape of our source object
type AcademicSource = {
    id: string;
    title: string;
    author: string;
    year: string;
    type: string;
    tags: string[];
    url: string;
    quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4';
};

const QUADRANTS = [
    { id: 'Q1', label: 'CRITICAL', desc: 'Important / Urgent', color: '#ea580c' },
    { id: 'Q2', label: 'STRATEGIC', desc: 'Important / Not Urgent', color: '#166534' },
    { id: 'Q3', label: 'TACTICAL', desc: 'Not Important / Urgent', color: '#ffffff' },
    { id: 'Q4', label: 'ARCHIVAL', desc: 'Not Important / Not Urgent', color: '#333333' }
];

export default function SourcesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeQuadrant, setActiveQuadrant] = useState<string | null>(null);
    const [sources, setSources] = useState<AcademicSource[]>([]);
    const parentRef = useRef<HTMLDivElement>(null);

    // Fetch data safely
    useEffect(() => {
        fetch('/data/sources.json')
            .then(res => res.json())
            .then(data => setSources(data))
            .catch(() => {
                console.warn("Failed to fetch sources.json, using fallback.");
                setSources(fallbackSources as AcademicSource[]);
            });
    }, []);

    // Memoize filtered source list for performance
    const filteredSources = useMemo(() => {
        let active = sources;

        if (activeQuadrant) {
            active = active.filter(src => src.quadrant === activeQuadrant);
        }

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            active = active.filter(src =>
                src.title.toLowerCase().includes(lowerQ) ||
                src.author.toLowerCase().includes(lowerQ) ||
                src.tags.some(tag => tag.toLowerCase().includes(lowerQ))
            );
        }

        return active;
    }, [searchQuery, activeQuadrant, sources]);

    // Setup Tanstack Virtualizer for buttery smooth 600+ items rendering
    // Extracted useCallback to its own variable if needed, or simply pass inline since React Compiler issues warning.
    const estimateSize = useCallback(() => 100, []);

    const virtualizer = useVirtualizer({
        count: filteredSources.length,
        getScrollElement: () => parentRef.current,
        estimateSize,
        overscan: 10,
    });

    return (
        <div className="max-w-7xl mx-auto pt-10 pb-20 flex flex-col h-[calc(100vh-140px)] font-serif bg-black">

            {/* ── Page Header & Triage Matrix ── */}
            <div className="shrink-0 mb-8 px-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left: Headers & Search */}
                    <div className="flex-1 w-full">
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2 uppercase" style={{ borderRadius: 0 }}>
                            Intelligence Triage & Sources
                        </h1>
                        <p className="text-xs text-white/50 tracking-[0.2em] font-mono uppercase mb-8">
                            Total Records: {sources.length} | Active View: {filteredSources.length}
                        </p>

                        <div className="relative border border-white/20 bg-black" style={{ borderRadius: 0 }}>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" strokeWidth={1} />
                            <input
                                type="text"
                                placeholder="Query database..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-sm text-white font-mono placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white transition-all rounded-none"
                            />
                        </div>
                    </div>

                    {/* Right: Eisenhower Matrix Filter */}
                    <div className="shrink-0 w-full md:w-[400px]">
                        <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-3 font-mono">
                            Eisenhower Filtering Matrix
                        </div>
                        <div className="grid grid-cols-2 grid-rows-2 gap-[1px] bg-white/20 border border-white/20" style={{ borderRadius: 0 }}>
                            {QUADRANTS.map((quad) => {
                                const isActive = activeQuadrant === quad.id;
                                return (
                                    <button
                                        key={quad.id}
                                        onClick={() => setActiveQuadrant(isActive ? null : quad.id)}
                                        className={`p-4 flex flex-col items-start justify-center transition-colors cursor-pointer rounded-none outline-none ${isActive ? 'bg-white' : 'bg-black hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`text-sm font-bold tracking-tight mb-1 ${isActive ? 'text-black' : ''}`} style={{ color: isActive ? '#000' : quad.color }}>
                                            [{quad.id}] {quad.label}
                                        </div>
                                        <div className={`text-[9px] uppercase tracking-widest font-mono ${isActive ? 'text-black/60' : 'text-white/40'}`}>
                                            {quad.desc}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Virtualized Directory ── */}
            <div className="flex-1 bg-black border-t border-white/20 overflow-hidden relative mx-6" style={{ borderRadius: 0 }}>
                {/* Scrollable Container */}
                <div
                    ref={parentRef}
                    className="w-full h-full overflow-y-auto custom-scrollbar"
                >
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualItem) => {
                            const src = filteredSources[virtualItem.index];
                            const quadColor = QUADRANTS.find(q => q.id === src.quadrant)?.color || '#ffffff';

                            return (
                                <div
                                    key={virtualItem.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                    className="border-b border-white/10"
                                >
                                    {/* Brutalist Source Row */}
                                    <div className="h-full bg-black hover:bg-white flex items-center justify-between px-6 py-4 transition-colors group cursor-default">

                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-bold font-mono tracking-widest group-hover:text-black" style={{ color: quadColor }}>
                                                    [{src.quadrant}]
                                                </span>
                                                <span className="text-[10px] uppercase font-mono tracking-widest text-white/50 group-hover:text-black/50">
                                                    {src.type}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-black truncate mb-2">
                                                {src.title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-white/50 font-mono group-hover:text-black/60 truncate">
                                                <span>{src.author}</span>
                                                <span className="w-1 h-1 bg-white/20 group-hover:bg-black/20" />
                                                <span>{src.year}</span>
                                                <span className="w-1 h-1 bg-white/20 group-hover:bg-black/20" />
                                                <span className="truncate">{src.tags.join(' · ')}</span>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            <a
                                                href={src.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-5 py-3 border border-white/20 bg-black text-white hover:bg-black hover:text-white group-hover:border-black group-hover:hover:bg-black group-hover:hover:text-white transition-all text-[11px] uppercase tracking-[0.2em] font-mono cursor-pointer"
                                                style={{ borderRadius: 0 }}
                                            >
                                                [ ACCESS SOURCE ]
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {filteredSources.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-white/30">
                            <Search className="w-8 h-8 mb-4 opacity-20" strokeWidth={1} />
                            <p className="text-xs uppercase tracking-widest font-mono">No intelligence records match this query.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
