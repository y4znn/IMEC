'use client';

import { useState, useMemo, useEffect, FormEvent, useRef } from 'react';
import { ExternalLink, Search, Terminal } from 'lucide-react';
import fallbackSources from '@/public/data/sources.json';
import IntelligencePulse from '@/components/IntelligencePulse';
import StatusBar from '@/components/StatusBar';
import IntelFeed from '@/components/IntelFeed';

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
    const [sources, setSources] = useState<AcademicSource[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Chat State
    const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
    const [inputQuery, setInputQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleChatSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputQuery.trim() || isLoading) return;

        const userMsg = inputQuery.trim();
        setInputQuery('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg })
            });

            const data = await res.json();
            if (res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `ERROR: ${data.error}` }]);
            }
        } catch (_error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'ERROR: Communication with intelligence server failed.' }]);
        } finally {
            setIsLoading(false);
        }
    };

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
            <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col items-center">
                
                {/* ── Section Title: Master Corridor Identifier ── */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards w-full">
                    <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tighter uppercase leading-none mb-4">
                        India Middle East Europe Economic Corridor
                    </h1>
                    <div className="flex flex-col items-center gap-6">
                        <p className="text-[11px] text-gray-900/40 tracking-[0.3em] font-mono uppercase">
                            [{sources.length}] Verified Sources
                        </p>
                        <div className="w-full max-w-4xl">
                            <StatusBar />
                        </div>
                    </div>
                </div>

                {/* ── Task C: Centered "Box" Optimization ── */}
                <div className="mb-16 flex justify-center w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-forwards max-w-4xl">
                    <IntelligencePulse />
                </div>

                {/* ── Main Dashboard Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full items-start">
                    
                    {/* Left & Center: Verified Source List (Col-span 2) */}
                    <div className="lg:col-span-2 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-forwards">
                        {/* Search Bar */}
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

                        {/* Source List */}
                        <div className="flex flex-col gap-6">
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

                    {/* Right: Live Intel Feed (Col-span 1) */}
                    <div className="lg:col-span-1 sticky top-32 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-forwards">
                        <IntelFeed />
                    </div>
                </div>
            </div>

            {/* ── Brutalist Command Terminal Chat ── */}
            <div className="fixed bottom-0 right-0 w-full md:w-[400px] border-t md:border-l border-black p-0 flex flex-col z-50 bg-white shadow-none rounded-none">
                <div className="bg-black text-white font-mono text-[10px] uppercase tracking-widest px-4 py-3 flex items-center gap-2 border-b border-black rounded-none">
                    <Terminal className="w-4 h-4" />
                    INTELLIGENCE TERMINAL
                </div>
                
                {messages.length > 0 && (
                    <div className="max-h-[40vh] overflow-y-auto w-full p-6 flex flex-col gap-6 font-mono text-sm border-b border-black">
                        {messages.map((msg, i) => (
                            <div key={i} className="flex flex-col gap-1.5">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                    {msg.role === 'user' ? 'USER_QUERY:' : 'TERMINAL_RESPONSE:'}
                                </span>
                                <div className={`p-4 border border-black bg-white text-black whitespace-pre-wrap leading-relaxed rounded-none ${msg.role === 'user' ? 'ml-6' : 'mr-6 bg-gray-50'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse mt-2">
                                [ PROCESSING INTELLIGENCE... ]
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                <form onSubmit={handleChatSubmit} className="flex w-full bg-white rounded-none">
                    <input
                        type="text"
                        placeholder="Awaiting directive..."
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-4 bg-white text-black font-mono text-xs placeholder-gray-400 focus:outline-none rounded-none border-none"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !inputQuery.trim()}
                        className="bg-black text-white px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-none rounded-none border-l border-black"
                    >
                        EXECUTE
                    </button>
                </form>
            </div>
        </div>
    );
}
