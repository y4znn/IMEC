'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Network, Shield, Anchor, Zap, Activity, Globe } from 'lucide-react';

const panels = [
    {
        title: 'The Strategic Prelude',
        icon: Globe,
        content: "To counter China's Belt and Road Initiative (BRI), the G7 launches the Partnership for Global Infrastructure and Investment (PGII), and the EU introduces the €300 Billion Global Gateway fund."
    },
    {
        title: 'The Diplomatic Foundation (2020-2022)',
        icon: Network,
        content: "The Abraham Accords and the I2U2 grouping (India, Israel, UAE, US) lay the geopolitical groundwork for Arab-Israeli integration."
    },
    {
        title: 'The G20 Launch (Sept 2023)',
        icon: Activity,
        content: "IMEC is officially announced in New Delhi via a Memorandum of Understanding by India, the US, UAE, Saudi Arabia, the EU, France, Germany, and Italy."
    },
    {
        title: 'The Tri-Pillar Architecture',
        icon: Zap,
        content: "IMEC is not just rail. It features three pillars: Transportation (maritime and rail networks), Energy (green hydrogen pipelines), and Digital (the Blue-Raman subsea fiber-optic cable bypassing Egypt)."
    },
    {
        title: 'The Red Sea Crisis',
        icon: Anchor,
        content: "Following the October 7 Gaza War, Houthi attacks paralyze the Suez Canal. This crisis paradoxically validates IMEC's strategic necessity as an overland redundancy route."
    },
    {
        title: 'Regional Rivalries',
        icon: Shield,
        content: "Outraged by exclusion, Turkey and Iraq accelerate the $17 Billion \"Development Road Project\" (DRP), while Russia and Iran push the INSTC."
    }
];

export default function DocumentaryPage() {
    const { scrollYProgress } = useScroll();
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const opacityBg = useTransform(scrollYProgress, [0, 0.5, 1], [0.15, 0.3, 0.15]);

    return (
        <div className="relative bg-zinc-950 -mt-20 -mx-6 px-6">
            {/* ── Fixed Map Nodes Background ── */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-zinc-950">
                <motion.div
                    style={{ y: backgroundY, opacity: opacityBg }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <svg width="100%" height="150%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Shifting Nodes */}
                        <circle cx="20%" cy="30%" r="2" fill="rgba(255,255,255,0.2)" />
                        <line x1="20%" y1="30%" x2="45%" y2="45%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <circle cx="45%" cy="45%" r="3" fill="rgba(255,255,255,0.4)" />

                        <line x1="45%" y1="45%" x2="75%" y2="35%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <circle cx="75%" cy="35%" r="2" fill="rgba(255,255,255,0.2)" />

                        <line x1="75%" y1="35%" x2="85%" y2="65%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <circle cx="85%" cy="65%" r="2" fill="rgba(255,255,255,0.2)" />

                        <line x1="45%" y1="45%" x2="35%" y2="75%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <circle cx="35%" cy="75%" r="2" fill="rgba(255,255,255,0.2)" />
                    </svg>
                </motion.div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_30vw_at_center,transparent_0%,#09090b_100%)] opacity-90" />
            </div>

            {/* ── Scrollable Story ── */}
            <div className="relative z-10 max-w-3xl mx-auto pb-40">
                {/* Hero Section */}
                <div className="min-h-screen flex flex-col justify-center items-center text-center pt-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }}
                        className="text-4xl md:text-5xl font-semibold text-zinc-100 mb-6 tracking-tight leading-snug"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        IMEC: The Geopolitical<br />Operating System
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
                        className="text-zinc-400 text-lg max-w-xl font-light tracking-wide leading-relaxed"
                    >
                        A structural response to Levantine instability and broader integration. Scroll to unearth the strategic doctrine.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 80 }}
                        transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
                        className="mt-16 w-[1px] bg-gradient-to-b from-zinc-500 to-transparent"
                    />
                </div>

                {/* Documentary Panels */}
                <div className="space-y-[60vh]">
                    {panels.map((panel, idx) => (
                        <ScrollyPanel key={idx} panel={panel} index={idx} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScrollyPanel({ panel, index }: { panel: any, index: number }) {
    const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: false });

    return (
        <div ref={ref} className="min-h-[60vh] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 40, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 md:p-10 shadow-2xl relative group"
            >
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 shrink-0 self-start">
                        <panel.icon className="w-6 h-6 text-zinc-300" strokeWidth={1.2} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-2 py-0.5 rounded-full border border-white/5">
                                Document {index + 1}
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-medium text-zinc-100 tracking-tight mb-4">
                            {panel.title}
                        </h2>
                        <p className="text-zinc-400 leading-relaxed font-light text-[15px] md:text-base">
                            {panel.content}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

