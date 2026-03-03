'use client';

import { Focus, GraduationCap, Library, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';


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
        thesisHeading: storyData?.thesisHeading || "Dissertation Title",
        thesis_synthesis: storyData?.thesis_synthesis || "India–Middle East–Europe Economic Corridor: Geoeconomic Architecture of a New Middle East",
        credentialsHeading: storyData?.credentialsHeading || "Academic Record",
        academicRecord: storyData?.academicRecord || [
            "MA in Strategic Studies, Joint Master’s – Lebanese University & Lebanese Armed Forces.<br />MA Thesis Title: Israeli Militarization of Artificial Intelligence: Case Study of the 2024 War",
            "BA in Philosophy and Political and Social Sciences - Lebanese University"
        ],
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
                className="pb-6 border-b border-gray-200 mb-8"
            >
                <div
                    className="text-3xl font-semibold text-gray-900 tracking-tight font-serif"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    {data.pageTitle}
                </div>
                <div className="mt-2 text-sm text-gray-500 font-light tracking-wide font-mono">
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
                    className="md:col-span-1 bg-white border border-gray-300 rounded-none p-6 flex flex-col items-center justify-center text-center shadow-sm group h-96"
                >
                    <img
                        src="/ahmad-profile.jpg"
                        alt="Ahmad's Profile Picture"
                        className="w-24 h-24 rounded-none border border-gray-300 mb-5 object-cover grayscale group-hover:grayscale-0 group-hover:border-gray-400 transition-all duration-500"
                    />

                    <div className="text-xl font-medium text-gray-900 tracking-tight font-serif mb-1 truncate w-full">
                        {data.researcherName}
                    </div>

                    <div className="mb-6 text-[11px] text-gray-600 tracking-widest uppercase font-mono truncate w-full">
                        {data.researcherTitle}
                    </div>

                    <a
                        href="https://lb.linkedin.com/in/ahmadghsnn"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-xs text-gray-900 hover:bg-gray-100 hover:text-black transition-all duration-300 rounded-none cursor-pointer"
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
                    className="md:col-span-3 bg-white border border-gray-300 rounded-none p-6 md:p-8 flex flex-col justify-center shadow-sm h-96"
                >
                    <div className="flex items-center gap-2 mb-6 shrink-0 border-b border-gray-300 pb-4">
                        <Focus className="w-4 h-4 text-gray-900 flex-shrink-0" strokeWidth={1.2} />
                        <div className="text-sm font-medium text-gray-900 font-mono uppercase tracking-widest">
                            {data.bioHeading}
                        </div>
                    </div>
                    <div className="text-gray-700 leading-relaxed font-light text-sm md:text-base font-serif overflow-y-auto whitespace-pre-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {data.executive_bio}
                    </div>
                </motion.div>

                {/* Box 3: The Thesis (col-span-2) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="md:col-span-2 bg-white border border-gray-300 rounded-none p-6 md:p-8 flex flex-col justify-center shadow-sm relative overflow-hidden h-96 group"
                >
                    <div className="absolute top-0 right-0 p-32 bg-[radial-gradient(circle,rgba(0,0,0,0.03)_0%,transparent_70%)] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />

                    <div className="mb-6 shrink-0 z-10 border-b border-gray-300 pb-4">
                        <div className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                            {data.thesisHeading}
                        </div>
                    </div>
                    <div
                        className="text-lg md:text-2xl text-gray-900 leading-tight font-medium font-serif z-10 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
                    className="md:col-span-1 bg-white border border-gray-300 rounded-none p-6 shadow-sm flex flex-col h-96"
                >
                    <div className="flex items-center gap-2 mb-6 shrink-0 border-b border-gray-300 pb-4">
                        <GraduationCap className="w-4 h-4 text-gray-900 flex-shrink-0" strokeWidth={1.2} />
                        <div className="text-sm font-medium text-gray-900 font-mono uppercase tracking-widest">
                            {data.credentialsHeading}
                        </div>
                    </div>
                    <div className="space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {data.academicRecord.map((record: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="text-gray-900 mt-1 flex-shrink-0 text-xs text-center">—</span>
                                <div className="text-xs text-gray-900 font-mono leading-relaxed">
                                    {record.split('<br />').map((line: string, lineIdx: number, arr: string[]) => (
                                        <span key={lineIdx}>
                                            {line}
                                            {lineIdx !== arr.length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Box 5: Publications Section (col-span-1) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="md:col-span-1 bg-white border border-gray-300 rounded-none p-6 shadow-sm flex flex-col h-96"
                >
                    <div className="flex items-center gap-2 mb-4 shrink-0 border-b border-gray-300 pb-4">
                        <Library className="w-4 h-4 text-gray-900 flex-shrink-0" strokeWidth={1.2} />
                        <div className="text-sm font-medium text-gray-900 font-mono tracking-widest uppercase">
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
                                    className="group flex flex-col w-full text-xs font-mono text-gray-600 transition-all duration-300 
                                    hover:text-black hover:bg-gray-100 border focus:outline-none focus:ring-1 focus:ring-gray-600 border-transparent hover:border-gray-300 p-2 -mx-2"
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
