'use client';

import { useState } from 'react';

const BRIEFING_FORM_URL = 'https://forms.gle/EzqDti6qaUHqRZHYA';

export default function IntelligencePulse() {
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="relative z-50 w-full max-w-[420px] mx-auto bg-white border border-gray-200 rounded-none p-8 shadow-sm hover:shadow-md transition-all text-left animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
            {/* ── Subscription Module Section ── */}
            <div>
                <h3 className="text-sm font-sans font-bold text-gray-900 tracking-tight uppercase mb-4">
                    Daily Intelligence Briefing
                </h3>

                {submitted ? (
                    <div className="py-3 px-4 bg-gray-50 border border-gray-100">
                        <p className="text-[11px] font-mono tracking-widest text-gray-900 uppercase leading-relaxed">
                            Thank you. Your application has been received. Our team will review it and get back to you.
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="text-[11px] font-mono tracking-widest text-gray-500 uppercase mb-4">
                            Subscribe via the form to receive the briefing.
                        </p>

                        <a
                            href={BRIEFING_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setSubmitted(true)}
                            className="block w-full text-center py-3.5 bg-gray-900 text-white font-mono text-[10px] tracking-[0.2em] uppercase hover:bg-black transition-colors"
                        >
                            Subscribe to the Briefing
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}
