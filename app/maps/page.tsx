'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Globe2 } from 'lucide-react';

export default function StrategicMaps() {
    return (
        <div className="absolute top-24 left-6 z-10 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl max-w-sm"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5 shrink-0">
                        <Globe2 className="w-5 h-5 text-zinc-300" strokeWidth={1.2} />
                    </div>
                    <h1
                        className="text-xl font-semibold text-zinc-100 tracking-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Data-Hologram
                    </h1>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-light mt-2">
                    Interact with the 3D topology to analyze the IMEC sovereign backbone versus the digital artery and Eurasian axis rivals.
                </p>
            </motion.div>
        </div>
    );
}
