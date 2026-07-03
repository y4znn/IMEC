'use client';

import { Focus, Library, Linkedin } from 'lucide-react';

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
        pageTitle: storyData?.pageTitle || "RESEARCHER PROFILE",
        pageSubtitle: storyData?.pageSubtitle || "",
        researcherName: storyData?.researcherName || "Ahmad Ghosn",
        researcherTitle: storyData?.researcherTitle || "",
        linkedinText: storyData?.linkedinText || "LinkedIn Profile",
        bioHeading: storyData?.bioHeading || "Executive Bio",
        executive_bio: storyData?.executive_bio || "Ahmad Ghosn is a researcher in strategic and military studies, with a focus on Middle Eastern security, regional power dynamics, and the evolving nature of warfare. His work increasingly engages questions of geopolitics and geoeconomics, particularly how emerging connectivity projects such as the India–Middle East–Europe Economic Corridor (IMEC) reconfigure regional influence, supply chains, and strategic alignments.\n\nHe holds an MA in Strategic Studies, a joint master’s degree between the Lebanese Armed Forces and the Lebanese University, where his research examined the Israeli militarisation of artificial intelligence through the 2024 Gaza–Lebanon war as a central case study. He also holds a BA in Philosophy from the Lebanese University, grounding his work in political thought and epistemology.",
        publicationsHeading: storyData?.publicationsHeading || "Publications",
        publications: storyData?.publications || []
    };

    return (
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 pt-6 md:pt-10 pb-12 md:pb-20 relative">
            {/* ── Page Header ── */}
            <div className="pb-4 md:pb-6 border-b border-gray-200 mb-6 md:mb-8">
                <div
                    className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight font-serif"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    {data.pageTitle}
                </div>
                <div className="mt-2 text-xs md:text-sm text-gray-400 font-light tracking-widest font-mono uppercase">
                    {data.pageSubtitle}
                </div>
            </div>

            {/* ── Profile Layout ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Left/Center: Executive Bio (col-span-3) */}
                <div className="md:col-span-3 bg-white border border-gray-300 rounded-none p-6 md:p-8 flex flex-col shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-300 pb-4">
                            <Focus className="w-4 h-4 text-gray-900 flex-shrink-0" strokeWidth={1.2} />
                            <div className="text-sm font-medium text-gray-900 font-mono uppercase tracking-widest">
                                {data.bioHeading}
                            </div>
                        </div>
                        <div className="text-gray-755 leading-relaxed font-light text-sm md:text-base font-serif whitespace-pre-wrap">
                            {data.executive_bio}
                        </div>
                    </div>
                    
                    <div className="mt-6 border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="text-sm font-bold text-gray-900 tracking-tight font-serif uppercase">
                                {data.researcherName}
                            </div>
                        </div>
                        <a
                            href="https://lb.linkedin.com/in/ahmadghsnn"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-xs text-gray-900 hover:bg-gray-100 hover:text-black transition-all duration-300 rounded-none cursor-pointer font-mono"
                        >
                            <Linkedin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.2} />
                            {data.linkedinText}
                        </a>
                    </div>
                </div>

                {/* Right: Publications (col-span-1) */}
                <div className="md:col-span-1 bg-white border border-gray-300 rounded-none p-6 shadow-sm flex flex-col min-h-[400px]">
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
                </div>

            </div>
        </div>
    );
}
