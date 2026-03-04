'use client';

import { motion } from 'framer-motion';
import { Globe2, Hand } from 'lucide-react';

export default function StrategicMaps() {
    return (
        <>
            {/* Desktop overlay card */}
            <div className="absolute top-24 left-6 z-10 pointer-events-none hidden md:block">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="bg-gray-100/40 backdrop-blur-xl border border-gray-400/5 rounded-2xl p-6 shadow-2xl max-w-sm"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-200 rounded-lg border border-gray-400/5 shrink-0">
                            <Globe2 className="w-5 h-5 text-gray-700" strokeWidth={1.2} />
                        </div>
                        <h1
                            className="text-xl font-semibold text-gray-900 tracking-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Interactive 2D Narrative Map
                        </h1>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-light mt-2">
                        Visualizing the IMEC multimodal supply chain. Hover or click nodes to explore the geopolitical architecture, strategic chokepoints, and infrastructure financing gaps.
                    </p>
                </motion.div>
            </div>

            {/* Mobile overlay card */}
            <div className="fixed bottom-4 left-4 right-4 z-10 pointer-events-none md:hidden">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl p-4 shadow-lg"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg border border-gray-200 shrink-0">
                            <Globe2 className="w-4 h-4 text-gray-700" strokeWidth={1.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1
                                className="text-base font-semibold text-gray-900 tracking-tight mb-1"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                Interactive Corridor Map
                            </h1>
                            <p className="text-[11px] text-gray-600 leading-relaxed font-light">
                                Pinch to zoom. Tap nodes to explore the IMEC geopolitical architecture.
                            </p>
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 font-mono">
                                <Hand className="w-3 h-3" />
                                <span>Touch to interact</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
