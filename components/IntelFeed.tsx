'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Toast from './Toast';

type Article = {
    id: number;
    date: string;
    source: string;
    title: string;
    url: string;
    direction: 'ltr' | 'rtl';
    category?: string;
};

const categoryStyle: Record<string, string> = {
    analysis: 'text-gray-600 bg-white border-gray-200',
    policy: 'text-gray-600 bg-white border-gray-200',
    news: 'text-gray-500 bg-gray-50 border-gray-200',
    opinion: 'text-gray-600 bg-white border-gray-200',
};

export default function IntelFeed() {
    const [data, setData] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/intel')
            .then((r) => r.json())
            .then((res) => {
                setData(res.articles || res);
                if (res.source === 'cached' && res.error) {
                    setToast(res.error);
                }
            })
            .catch((error) => {
                console.error('Error fetching articles:', error);
                setToast('Unable to reach data pipeline. Displaying cached sources.');
            })
            .finally(() => setLoading(false));
    }, []);

    const estimateSize = useCallback(() => 88, []);
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize,
        overscan: 10,
    });

    return (
        <>
            {toast && <Toast message={toast} type="warning" onDismiss={() => setToast(null)} />}

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-gray-500" strokeWidth={1.2} />
                        <h2 className="text-[13px] font-semibold text-gray-700 tracking-tight">
                            Research & Policy Feed
                        </h2>
                        <span className="text-[11px] text-gray-500 ml-1">
                            {data.length} articles
                        </span>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" strokeWidth={1.2} />
                        <span className="text-[13px] text-gray-500">Loading articles…</span>
                    </div>
                ) : (
                    <div
                        ref={parentRef}
                        className="overflow-y-auto"
                        style={{ maxHeight: '520px' }}
                    >
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const item = data[virtualRow.index];
                                return (
                                    <div
                                        key={virtualRow.key}
                                        data-index={virtualRow.index}
                                        ref={virtualizer.measureElement}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            dir={item.direction}
                                            className="flex items-start justify-between gap-4 px-4 py-3 group transition-colors duration-150 cursor-pointer hover:bg-gray-100/30 border-b border-gray-200"
                                        >
                                            <div className={`flex-1 min-w-0 ${item.direction === 'rtl' ? 'text-right' : ''}`}>
                                                <div
                                                    className={`flex items-center gap-2 mb-1 text-[11px] ${item.direction === 'rtl' ? 'flex-row-reverse justify-end' : ''
                                                        }`}
                                                >
                                                    <span className="text-gray-500 tabular-nums">{item.date}</span>
                                                    <span className="text-gray-400">·</span>
                                                    <span className="text-gray-600 font-medium">{item.source}</span>
                                                    {item.category && (
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-[9px] uppercase border ${categoryStyle[item.category] || categoryStyle.news
                                                                }`}
                                                        >
                                                            {item.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <p
                                                    className="text-[14px] text-gray-600 group-hover:text-gray-800 transition-colors leading-snug tracking-tight"
                                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                                >
                                                    {item.title}
                                                </p>
                                            </div>
                                            <ExternalLink
                                                className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 mt-1.5"
                                                strokeWidth={1.2}
                                            />
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>
        </>
    );
}
