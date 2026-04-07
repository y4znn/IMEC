'use client';

import React from 'react';
import { FTA_AGREEMENTS, DEFENCE_PARTNERSHIPS, REFERENCE_LINKS } from '@/data/imec-geo-constants';

export type LayerConfig = {
  imecCorridor: boolean;
  railways: boolean;
  subseaTelecom: boolean;
  blueCable: boolean;
  ramanCable: boolean;
  briCompetitor: boolean;
  geopolitical: boolean;
};

interface GlobalStatsOverlayProps {
  layers: LayerConfig;
  toggleLayer: (key: keyof LayerConfig) => void;
}

function GlobalStatsOverlayInner({ layers, toggleLayer }: GlobalStatsOverlayProps) {
  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3 pointer-events-none max-h-[calc(100vh-2rem)] overflow-y-auto imec-scrollbar">
      
      {/* ── Mission Control Layers ── */}
      <div className="bg-white border border-neutral-200 p-3 w-64 pointer-events-auto">
        <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#000000] mb-3 border-b border-neutral-200 pb-2">
          Mission Control
        </h3>

        <div className="flex flex-col gap-1.5">
          <LayerToggle
            label="IMEC Corridor (Master)"
            sublabel="Full execution display"
            active={layers.imecCorridor}
            onClick={() => toggleLayer('imecCorridor')}
            color="bg-emerald-800"
          />
          <LayerToggle
            label="Railways"
            sublabel="Active, Proposed, Missing"
            active={layers.railways}
            onClick={() => toggleLayer('railways')}
            color="bg-orange-700"
          />
          
          <div className="flex flex-col gap-1">
            <LayerToggle
              label="IMEC Subsea Telecom"
              active={layers.subseaTelecom}
              onClick={() => toggleLayer('subseaTelecom')}
              color="bg-[#000000]"
            />
            {layers.subseaTelecom && (
              <div className="ml-4 flex flex-col gap-1 border-l border-neutral-200 pl-2">
                <LayerToggle
                  label="Blue Cable"
                  active={layers.blueCable}
                  onClick={() => toggleLayer('blueCable')}
                  color="bg-emerald-800"
                  mini
                />
                <LayerToggle
                  label="Raman Cable"
                  active={layers.ramanCable}
                  onClick={() => toggleLayer('ramanCable')}
                  color="bg-orange-700"
                  mini
                />
              </div>
            )}
          </div>

          <LayerToggle
            label="China's Belt & Road (BRI)"
            sublabel="Competitor Overlay"
            active={layers.briCompetitor}
            onClick={() => toggleLayer('briCompetitor')}
            color="bg-slate-600"
          />
          <LayerToggle
            label="Geopolitical Architecture"
            sublabel="FTAs, Defence, Data Centers"
            active={layers.geopolitical}
            onClick={() => toggleLayer('geopolitical')}
            color="bg-[#000000]"
          />
        </div>
      </div>

      {/* ── Legend (when Geopolitical active) ── */}
      {layers.geopolitical && (
        <div className="bg-white border border-neutral-200 p-3 w-64 pointer-events-auto">
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
            Architecture Legend
          </h4>
          <div className="flex flex-col gap-2">
            <div className="font-sans font-bold text-[9px] uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-1">
              FTAs
            </div>
            {FTA_AGREEMENTS.slice(0,4).map((fta) => (
              <div key={fta.name} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-none flex-shrink-0"
                  style={{ backgroundColor: fta.status === 'In Force' ? '#065F46' : '#C2410C' }}
                />
                <a
                  href={fta.ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans font-bold text-[10px] text-neutral-900 hover:text-black transition-colors truncate"
                >
                  {fta.name}
                </a>
              </div>
            ))}
            
            <div className="font-sans font-bold text-[9px] uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-1 mt-2">
              Defence Pacts
            </div>
            {DEFENCE_PARTNERSHIPS.map((dp) => (
              <a
                key={dp.name}
                href={dp.ref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 group"
              >
                <div
                  className="w-2 h-2 rounded-none flex-shrink-0"
                  style={{
                    backgroundColor: `rgba(${dp.color[0]}, ${dp.color[1]}, ${dp.color[2]}, 0.9)`,
                  }}
                />
                <span className="font-sans font-bold text-[10px] text-neutral-900 group-hover:text-black transition-colors truncate">
                  {dp.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── References ── */}
      <div className="bg-white border border-neutral-200 p-2.5 w-64 pointer-events-auto">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {[
            { label: 'Cable Map', href: REFERENCE_LINKS.blueCable },
            { label: 'Railway Map', href: REFERENCE_LINKS.openRailwayMap },
            { label: 'Cloud Infra', href: REFERENCE_LINKS.cloudInfraMap },
          ].map((ref) => (
            <a
              key={ref.label}
              href={ref.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans font-bold text-[9px] text-[#000000] hover:text-[#C2410C] transition-colors uppercase tracking-wider"
            >
              {ref.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Toggle Component ──────────────────────────────────────

function LayerToggle({
  label,
  sublabel,
  active,
  onClick,
  color,
  mini
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
  color: string;
  mini?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full text-left ${mini ? 'py-1 px-1.5' : 'py-1.5 px-2'} group transition-all duration-200 ${
        active
          ? 'bg-neutral-50 border border-neutral-200'
          : 'border border-transparent hover:bg-neutral-50'
      }`}
    >
      <div
        className={`flex-shrink-0 transition-all duration-300 rounded-none ${mini ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${
          active ? `${color}` : 'bg-neutral-300'
        }`}
      />
      <div className="flex flex-col min-w-0">
        <span
          className={`font-sans tracking-wide transition-colors ${mini ? 'text-[9px] uppercase font-bold' : 'text-[11px]'} ${
            active ? 'text-[#000000] font-bold' : 'text-neutral-500 group-hover:text-neutral-700 font-bold'
          }`}
        >
          {label}
        </span>
        {sublabel && active && (
          <span className="font-sans font-bold text-[8px] text-neutral-500 uppercase tracking-wider mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </button>
  );
}

const GlobalStatsOverlay = React.memo(GlobalStatsOverlayInner);
export default GlobalStatsOverlay;
