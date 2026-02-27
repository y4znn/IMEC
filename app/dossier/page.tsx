'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Linkedin, GraduationCap, Library, Focus } from 'lucide-react';

export default function ResearcherDossier() {
    return (
        <div className="max-w-5xl mx-auto space-y-4 pt-10 pb-20">
            {/* ── Page Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="pb-6 border-b border-white/[0.05] mb-8"
            >
                <h1
                    className="text-3xl font-semibold text-zinc-100 tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    Executive Dossier
                </h1>
                <p className="text-sm text-zinc-500 mt-2 font-light tracking-wide">
                    Principal Investigator Profile & Academic Framework
                </p>
            </motion.div>

            {/* ── Bento Grid Layout ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Box 1: Profile (col-span-1) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="md:col-span-1 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl group"
                >
                    <div className="w-24 h-24 rounded-full bg-zinc-800 border border-white/10 mb-5 flex items-center justify-center grayscale overflow-hidden group-hover:border-zinc-500 transition-colors duration-500">
                        {/* Static Placeholder Headshot */}
                        <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                            <User className="w-10 h-10 text-zinc-400" strokeWidth={1} />
                        </div>
                    </div>
                    <h2 className="text-xl font-medium text-zinc-100 tracking-tight">Ahmad Ghosn</h2>
                    <p className="text-[11px] font-mono text-zinc-500 mt-1 mb-6 tracking-widest uppercase">Ph.D. Candidate</p>

                    <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all duration-300"
                    >
                        <Linkedin className="w-3.5 h-3.5" strokeWidth={1.2} />
                        LinkedIn Profile
                    </a>
                </motion.div>

                {/* Box 2: Executive Bio (col-span-3) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="md:col-span-3 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 flex flex-col justify-center shadow-xl"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Focus className="w-4 h-4 text-zinc-500" strokeWidth={1.2} />
                        <h3 className="text-sm font-medium text-zinc-300">Executive Bio</h3>
                    </div>
                    <p className="text-zinc-400 leading-relaxed font-light text-sm md:text-base">
                        Ahmad Ghosn is a doctoral researcher specializing in the geoeconomic structural frameworks of the Middle East, with a specific focus on the India-Middle East-Europe Economic Corridor (IMEC). His research lies at the intersection of Neoclassical Realism and supply chain resilience, analyzing how geopolitical actors deploy connective infrastructure as mechanisms of statecraft. Prior to his current PhD work, he contributed to extensive intelligence briefings analyzing Eurasian connectivity and systemic risk.
                    </p>
                </motion.div>

                {/* Box 3: The Thesis (col-span-2) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="md:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 flex flex-col justify-center shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-32 bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />

                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4 block">
                        Thesis Synthesis
                    </span>
                    <p
                        className="text-2xl md:text-3xl text-zinc-200 leading-tight font-medium"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        &ldquo;IMEC functions as a geopolitical operating system requiring structural redundancy to survive Levantine instability.&rdquo;
                    </p>
                </motion.div>

                {/* Box 4: Education (col-span-1) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="md:col-span-1 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="w-4 h-4 text-zinc-500" strokeWidth={1.2} />
                        <h3 className="text-sm font-medium text-zinc-300">Credentials</h3>
                    </div>
                    <ul className="space-y-4">
                        <li>
                            <p className="text-sm text-zinc-200 font-medium">Ph.D. International Relations</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Focus: Geoeconomic Corridors</p>
                        </li>
                        <li>
                            <p className="text-sm text-zinc-200 font-medium">M.A. Strategic Studies</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Eurasian Connectivity Analysis</p>
                        </li>
                    </ul>
                </motion.div>

                {/* Box 5: Publications (col-span-1) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="md:col-span-1 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Library className="w-4 h-4 text-zinc-500" strokeWidth={1.2} />
                        <h3 className="text-sm font-medium text-zinc-300">Publications</h3>
                    </div>
                    <ul className="space-y-4">
                        <li>
                            <p className="text-sm text-zinc-200 font-medium leading-snug">The Peace Premium Mirage</p>
                            <p className="text-[11px] text-zinc-500 mt-1">Journal of Geopolitics · 2024</p>
                        </li>
                        <li>
                            <p className="text-sm text-zinc-200 font-medium leading-snug">Overland Redundancy</p>
                            <p className="text-[11px] text-zinc-500 mt-1">Global Trade Review · 2023</p>
                        </li>
                    </ul>
                </motion.div>

            </div>
        </div>
    );
}
