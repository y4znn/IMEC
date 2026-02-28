'use client';

import React from 'react';

export default function CRTOverlay() {
    return (
        <div className="pointer-events-none fixed inset-0 z-[200] h-screen w-screen opacity-[0.08] pointer-events-none mix-blend-overlay">
            {/* Sub-pixel chromatic RGB grain */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:3px_100%] z-50 pointer-events-none" />

            {/* Moving horizontal scanlines */}
            <div className="absolute inset-0 pointer-events-none animate-scanline bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.5))] bg-[length:100%_4px]" />

            {/* Radial screen vignette shadowing */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]" />
        </div>
    );
}
