'use client';

import { Focus, GraduationCap, Library, Linkedin, User } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface Publication {
    title: string;
    url: string;
}

interface ProfileClientProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storyData: any;
}

export default function ProfileClient({ storyData }: ProfileClientProps) {
    // Read static final content from injected JSON state
    const data = {
        pageTitle: storyData?.pageTitle || "Strategic Dossier",
        pageSubtitle: storyData?.pageSubtitle || "Principal Investigator Profile & Research Framework",
        researcherName: storyData?.researcherName || "Ahmad Ghosn",
        researcherTitle: storyData?.researcherTitle || "Ph.D. Candidate",
        linkedinText: storyData?.linkedinText || "LinkedIn Profile",
        bioHeading: storyData?.bioHeading || "Executive Bio",
        executive_bio: storyData?.executive_bio || "Ahmad Ghosn is a doctoral researcher specializing...",
        thesisHeading: storyData?.thesisHeading || "Thesis Synthesis",
        thesis_synthesis: storyData?.thesis_synthesis || "“IMEC functions as a geopolitical operating system requiring structural redundancy to survive Levantine instability.”",
        credentialsHeading: storyData?.credentialsHeading || "Academic Record",
        cred1Title: storyData?.cred1Title || "Ph.D. International Relations",
        cred1Subtitle: storyData?.cred1Subtitle || "Focus: Geoeconomic Corridors",
        cred2Title: storyData?.cred2Title || "M.A. Strategic Studies",
        cred2Subtitle: storyData?.cred2Subtitle || "Eurasian Connectivity Analysis",
        publicationsHeading: storyData?.publicationsHeading || "Publications",
        publications: storyData?.publications || []
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pt-10 pb-20 relative">
            {/* ── Page Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="pb-6 border-b border-white/[0.05] mb-8"
            >
                <div
                    className="text-3xl font-semibold text-zinc-100 tracking-tight font-serif"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    {data.pageTitle}
                </div>
                <div className="mt-2 text-sm text-zinc-500 font-light tracking-wide font-mono">
                    {data.pageSubtitle}
                </div>
            </motion.div>

            {/* ── Bento Grid Layout ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Box 1: Profile (col-span-1) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="md:col-span-1 bg-black border border-white rounded-none p-6 flex flex-col items-center justify-center text-center shadow-xl group h-96"
                >
                    <div className="w-24 h-24 rounded-none bg-black border border-white/20 mb-5 flex items-center justify-center grayscale group-hover:border-zinc-500 transition-colors duration-500">
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                            <User className="w-10 h-10 text-white" strokeWidth={1} />
                        </div>
                    </div>

                    <div className="text-xl font-medium text-white tracking-tight font-serif mb-1 truncate w-full">
                        {data.researcherName}
                    </div>

                    <div className="mb-6 text-[11px] text-zinc-400 tracking-widest uppercase font-mono truncate w-full">
                        {data.researcherTitle}
                    </div>

                    <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-white text-xs text-white hover:bg-white hover:text-black transition-all duration-300 rounded-none cursor-pointer"
                    >
                        <Linkedin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.2} />
                        <div className="font-mono">
                            {data.linkedinText}
                        </div>
                    </a>
                </motion.div>

                {/* Box 2: Executive Bio (col-span-3) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="md:col-span-3 bg-black border border-white rounded-none p-6 md:p-8 flex flex-col justify-center shadow-xl h-96"
                >
                    <div className="flex items-center gap-2 mb-6 shrink-0 border-b border-white/20 pb-4">
                        <Focus className="w-4 h-4 text-white flex-shrink-0" strokeWidth={1.2} />
                        <div className="text-sm font-medium text-white font-mono uppercase tracking-widest">
                            {data.bioHeading}
                        </div>
                    </div>
                    <div className="text-zinc-300 leading-relaxed font-light text-sm md:text-base font-serif overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {data.executive_bio}
                    </div>
                </motion.div>

                {/* Box 3: The Thesis (col-span-2) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="md:col-span-2 bg-black border border-white rounded-none p-6 md:p-8 flex flex-col justify-center shadow-xl relative overflow-hidden h-96 group"
                >
                    <div className="absolute top-0 right-0 p-32 bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />

                    <div className="mb-6 shrink-0 z-10 border-b border-white/20 pb-4">
                        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                            {data.thesisHeading}
                        </div>
                    </div>
                    <div
                        className="text-lg md:text-2xl text-white leading-tight font-medium font-serif z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        {data.thesis_synthesis}
                    </div>
                </motion.div>

                {/* Box 4: Education (col-span-1) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="md:col-span-1 bg-black border border-white rounded-none p-6 shadow-xl flex flex-col h-96"
                >
                    <div className="flex items-center gap-2 mb-6 shrink-0 border-b border-white/20 pb-4">
                        <GraduationCap className="w-4 h-4 text-white flex-shrink-0" strokeWidth={1.2} />
                        <div className="text-sm font-medium text-white font-mono uppercase tracking-widest">
                            {data.credentialsHeading}
                        </div>
                    </div>
                    <div className="space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div>
                            <div className="text-sm text-white font-medium font-serif leading-snug">
                                {data.cred1Title}
                            </div>
                            <div className="mt-1">
                                <div className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                                    {data.cred1Subtitle}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-white font-medium font-serif leading-snug">
                                {data.cred2Title}
                            </div>
                            <div className="mt-1">
                                <div className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                                    {data.cred2Subtitle}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Box 5: Publications Section (col-span-1) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="md:col-span-1 bg-black border border-white rounded-none p-6 shadow-xl flex flex-col h-96"
                >
                    <div className="flex items-center gap-2 mb-4 shrink-0 border-b border-white/20 pb-4">
                        <Library className="w-4 h-4 text-white flex-shrink-0" strokeWidth={1.2} />
                        <div className="text-sm font-medium text-white font-mono tracking-widest uppercase">
                            {data.publicationsHeading}
                        </div>
                    </div>

                    {/* ── Scrollable Terminal Log Container with Hidden Scrollbar ── */}
                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="flex flex-col space-y-3 pb-2">
                            {data.publications.map((pub: Publication, i: number) => (
                                <a
                                    key={i}
                                    href={pub.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col w-full text-xs font-mono text-zinc-400 transition-all duration-300 
                                    hover:text-black hover:bg-white border focus:outline-none focus:ring-1 focus:ring-white border-transparent hover:border-white p-2 -mx-2"
                                >
                                    <span className="opacity-50 text-[9px] mb-1 group-hover:text-black font-semibold uppercase tracking-widest">
                                        REF {(i + 1).toString().padStart(2, '0')}
                                    </span>
                                    <span className="line-clamp-2 leading-tight group-hover:text-black">
                                        {pub.title}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
