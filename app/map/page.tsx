'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Dynamically import the map component — no SSR (WebGL)
const ImecMap = dynamic(() => import('@/components/ImecMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-slate-950 font-mono text-cyan-400/60 uppercase tracking-[0.3em] text-xs">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        <span>Initializing Geospatial Context...</span>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 overflow-hidden">
      {/* ── Floating Navigation ── */}
      <div className="absolute top-4 right-4 z-[500] flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white font-mono text-[9px] tracking-[0.15em] uppercase px-3 py-2 hover:border-white/20 transition-all"
        >
          <ArrowLeft size={12} />
          Back
        </Link>
      </div>

      {/* ── Map Title Badge ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500]">
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-5 py-2 flex items-center gap-3">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <h1 className="font-sans font-bold text-sm tracking-tight text-white">
            IMEC Corridor
          </h1>
          <span className="font-mono text-[8px] text-gray-400 uppercase tracking-[0.2em]">
            3D Intelligence Map
          </span>
        </div>
      </div>

      {/* ── Full-Screen Map ── */}
      <ImecMap />
    </div>
  );
}
