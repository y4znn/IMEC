'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

interface BottlenecksPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BottlenecksPanel({ isOpen, onClose }: BottlenecksPanelProps) {
    const issues = [
        {
            title: "The Jordan Financing Gap",
            description: "A critical $5 billion funding shortfall exists to build the 225km standard-gauge rail link connecting Al-Haditha (Saudi Arabia) to Beit She'an (Israel).",
        },
        {
            title: "Haifa Port Security",
            description: "The Gaza conflict and Hezbollah missile threats have severely increased security risks, jeopardizing Haifa's role as the primary Mediterranean gateway.",
        },
        {
            title: "Rival Corridors (Al Faw)",
            description: "The $17 billion Iraq Development Road Project is actively competing with IMEC for European trade dominance.",
        },
        {
            title: "Diplomatic Freeze",
            description: "Saudi-Israeli normalization—the political bedrock of the IMEC overland route—remains stalled indefinitely.",
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-[420px] bg-gray-50 border-l border-gray-300 z-50 shadow-2xl flex flex-col"
                        style={{ borderRadius: 0 }}
                    >
                        {/* Header */}
                        <div className="px-8 flex items-center justify-between mt-24 pb-6 border-b border-gray-200 shrink-0">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600" strokeWidth={1.5} />
                                <h2 className="text-[13px] font-mono tracking-[0.2em] font-bold text-gray-900 uppercase">
                                    Strategic Bottlenecks
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                            >
                                <X className="w-5 h-5" strokeWidth={1} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
                            {issues.map((issue, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex items-baseline gap-3 mb-2">
                                        <div className="text-[10px] font-mono text-red-600 font-bold bg-red-50 px-1.5 py-0.5 border border-red-200 shrink-0">
                                            ISSU 0{idx + 1}
                                        </div>
                                        <h3 className="text-[16px] font-serif font-bold text-gray-900 tracking-tight leading-tight">
                                            {issue.title}
                                        </h3>
                                    </div>
                                    <p className="text-[13px] font-serif text-gray-600 leading-relaxed pl-12 border-l border-transparent group-hover:border-red-200 transition-colors">
                                        {issue.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t border-gray-200 shrink-0">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest text-center">
                                Data synced with live intelligence feeds
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
