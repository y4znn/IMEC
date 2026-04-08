'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const QUOTES = [
  {
    title: 'Global Context',
    text: 'The IMEC project is part of the wider Partnership for Global Infrastructure and Investment (PGII)... aims to meet the needs of low and middle-income countries (LMICs).',
  },
  {
    title: 'Strategic Telecoms',
    text: 'The IMEC partner countries must take a strategic view of the telecom networks... and halt the further onslaught of Chinese companies.',
    source: 'ORF',
  },
  {
    title: 'The Aspiration',
    text: 'The opportunity to meet the aspirations of over 6 billion people in the developing world... building sustainable, resilient, and inclusive infrastructure.',
    source: 'PGII Summit 2023',
  },
  {
    title: 'Digital Silk Road Competition',
    text: "By May 2023, [Chinese companies] had built or acquired ownership stakes in 13 of MENA's 62 subsea cables... underscores the urgent need for greater U.S. engagement.",
  },
  {
    title: 'Infrastructure Monopoly',
    text: "Egypt serves as a 'single point of failure' for subsea cables highlighting the urgent search for 'commercial diversity'.",
  },
  {
    title: 'The Geostrategic Lens',
    text: 'The control of core technology by others is our biggest hidden danger.',
    source: 'Xi Jinping',
  },
];

export default function NarrativeOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('hasSeenNarrativeMap');
    if (!hasSeen && !isOpen) {
      // Defer state updates to avoid synchronous setState in effect
      queueMicrotask(() => {
        setShouldRender(true);
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else if (isOpen) {
      queueMicrotask(() => {
        setShouldRender(true);
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      queueMicrotask(() => setIsAnimating(false));
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    sessionStorage.setItem('hasSeenNarrativeMap', 'true');
    setIsAnimating(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center p-4 transition-none ${
        isAnimating ? 'bg-black/20' : 'bg-transparent'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`relative w-full max-w-4xl bg-[#ffffff] border border-[#e5e7eb] p-6 md:p-10 max-h-[90vh] overflow-y-auto brutalist-scrollbar transition-none ${
          isAnimating
            ? 'opacity-100'
            : 'opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="font-sans font-bold text-2xl tracking-tight text-[#000000] uppercase">
              IMEC Corridor Narrative
            </h2>
            <div className="font-sans font-bold text-[10px] text-[#000000] uppercase tracking-[0.2em] mt-1">
              Geoeconomic Context & Strategic Quotes
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[#000000] hover:bg-gray-100 transition-none p-1 border border-[#e5e7eb] bg-white"
            aria-label="Close Narrative Overlay"
            id="narrative-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quote Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUOTES.map((q, i) => (
            <div
              key={i}
              className={`border border-[#e5e7eb] bg-[#ffffff] p-5 hover:border-[#000000] transition-none cursor-default ${
                isAnimating ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transitionDelay: '0ms',
              }}
            >
              <h3 className="font-sans font-bold text-[10px] uppercase tracking-[0.15em] text-[#000000] mb-3 border-b border-[#e5e7eb] pb-2">
                {q.title}
              </h3>
              <p className="font-sans font-bold text-sm text-[#000000] leading-relaxed">
                &ldquo;{q.text}&rdquo;
              </p>
              {q.source && (
                <div className="mt-4 font-sans font-bold text-[9px] text-[#000000] uppercase tracking-[0.2em] text-right">
                  — {q.source}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Stat Bar */}
        <div className="mt-8 pt-4 border-t border-[#e5e7eb] flex items-center justify-between">
          <div className="font-sans font-bold text-[9px] text-[#000000] uppercase tracking-[0.2em]">
            40% Global Population · $47T GDP · 11.3M+ Sources Indexed
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#000000]" />
            <span className="font-sans font-bold text-[8px] text-[#000000] uppercase tracking-[0.2em]">
              Live Intelligence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
