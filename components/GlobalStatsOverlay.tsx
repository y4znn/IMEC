'use client';

import React from 'react';
import { FTA_AGREEMENTS, DEFENCE_PARTNERSHIPS, REFERENCE_LINKS } from '@/data/imec-geo-constants';

export type LayerConfig = {
  cables: boolean;
  railways: boolean;
  dataCenters: boolean;
  hexagons: boolean;
  ftas: boolean;
  defence: boolean;
  competitors: boolean;
  weaknesses: boolean;
};

interface GlobalStatsOverlayProps {
  layers: LayerConfig;
  toggleLayer: (key: keyof LayerConfig) => void;
}

function GlobalStatsOverlayInner({ layers, toggleLayer }: GlobalStatsOverlayProps) {
  return (
    <div className="absolute top-4 left-4 z-[400] flex flex-col gap-3 pointer-events-none max-h-[calc(100vh-2rem)] overflow-y-auto imec-scrollbar">

      {/* ── Global Impact HUD ── */}
      <div className="bg-white border border-neutral-200 p-3 w-64 pointer-events-auto">
        <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-600 mb-3 border-b border-neutral-200 pb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          IMEC Intelligence Feed
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <div className="text-3xl font-sans font-bold tracking-tighter text-neutral-900 leading-none">
              40%
            </div>
            <div className="text-[11px] font-sans text-neutral-500 mt-0.5">
              of the global population
            </div>
          </div>

          <div>
            <div className="text-3xl font-sans font-bold tracking-tighter text-neutral-900 leading-none">
              $47T
            </div>
            <div className="text-[11px] font-sans text-neutral-500 mt-0.5">
              USD — half of global GDP
            </div>
          </div>
        </div>
      </div>

      {/* ── Infrastructure Layers ── */}
      <div className="bg-white border border-neutral-200 p-3 w-64 pointer-events-auto">
        <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3 border-b border-neutral-200 pb-2">
          Infrastructure Layers
        </h3>

        <div className="flex flex-col gap-1.5">
          <LayerToggle
            label="Demographic Density"
            sublabel="HexagonLayer · 3D"
            active={layers.hexagons}
            onClick={() => toggleLayer('hexagons')}
            color="bg-amber-400"
          />
          <LayerToggle
            label="Subsea Cables"
            sublabel="Blue + Raman"
            active={layers.cables}
            onClick={() => toggleLayer('cables')}
            color="bg-blue-400"
          />
          <LayerToggle
            label="Railway Networks"
            sublabel="Existing + Proposed"
            active={layers.railways}
            onClick={() => toggleLayer('railways')}
            color="bg-emerald-400"
          />
          <LayerToggle
            label="Data Centres"
            sublabel="9 IMEC nodes"
            active={layers.dataCenters}
            onClick={() => toggleLayer('dataCenters')}
            color="bg-cyan-400"
          />
        </div>
      </div>

      {/* ── Geopolitical Layers ── */}
      <div className="bg-white border border-neutral-200 p-3 w-64 pointer-events-auto">
        <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-3 border-b border-neutral-200 pb-2">
          Geopolitical Overlays
        </h3>

        <div className="flex flex-col gap-1.5">
          <LayerToggle
            label="Free Trade Agreements"
            sublabel={layers.ftas ? `${FTA_AGREEMENTS.filter(f => f.status === 'In Force').length} In Force · ${FTA_AGREEMENTS.filter(f => f.status === 'Proposed').length} Proposed` : undefined}
            active={layers.ftas}
            onClick={() => toggleLayer('ftas')}
            color="bg-emerald-500"
          />
          <LayerToggle
            label="Defence Partnerships"
            sublabel={layers.defence ? `${DEFENCE_PARTNERSHIPS.length} active pacts` : undefined}
            active={layers.defence}
            onClick={() => toggleLayer('defence')}
            color="bg-red-500"
          />
          <LayerToggle
            label="Competitors (BRI/BRICS)"
            sublabel={layers.competitors ? '~70 BRI + 11 BRICS' : undefined}
            active={layers.competitors}
            onClick={() => toggleLayer('competitors')}
            color="bg-neutral-500"
          />
          <LayerToggle
            label="Strategic Weaknesses"
            sublabel={layers.weaknesses ? 'Egypt · Turkey' : undefined}
            active={layers.weaknesses}
            onClick={() => toggleLayer('weaknesses')}
            color="bg-orange-500"
            warning
          />
        </div>
      </div>

      {/* ── Legend (when FTA active) ── */}
      {layers.ftas && (
      <div className="bg-white border border-neutral-200 p-3 w-64 pointer-events-auto">
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
            FTA Legend
          </h4>
          <div className="flex flex-col gap-1">
            {FTA_AGREEMENTS.map((fta) => (
              <div key={fta.name} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: fta.status === 'In Force' ? '#10B981' : '#06B6D4' }}
                />
                <a
                  href={fta.ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[10px] text-neutral-700 hover:text-black transition-colors truncate"
                >
                  {fta.name}
                </a>
                <span className={`font-mono text-[7px] uppercase tracking-wider ml-auto flex-shrink-0 ${
                  fta.status === 'In Force' ? 'text-emerald-400' : 'text-cyan-400'
                }`}>
                  {fta.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Defence Legend ── */}
      {layers.defence && (
      <div className="bg-white border border-neutral-200 p-3 w-64 pointer-events-auto">
          <h4 className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
            Defence Pacts
          </h4>
          <div className="flex flex-col gap-1">
            {DEFENCE_PARTNERSHIPS.map((dp) => (
              <a
                key={dp.name}
                href={dp.ref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 group"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: `rgba(${dp.color[0]}, ${dp.color[1]}, ${dp.color[2]}, 0.9)`,
                  }}
                />
                <span className="font-sans text-[10px] text-neutral-700 group-hover:text-black transition-colors">
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
            { label: 'Trade Explorer', href: REFERENCE_LINKS.tradExplorer },
            { label: 'Cloud Infra', href: REFERENCE_LINKS.cloudInfraMap },
          ].map((ref) => (
            <a
              key={ref.label}
              href={ref.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[8px] text-neutral-500 hover:text-cyan-700 transition-colors uppercase tracking-wider"
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
  warning,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
  color: string;
  warning?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full text-left py-1.5 px-2 group transition-all duration-200 ${
        active
          ? 'bg-neutral-50 border border-neutral-200'
          : 'border border-transparent hover:bg-neutral-50'
      }`}
    >
      <div
        className={`w-2 h-2 flex-shrink-0 transition-all duration-300 ${
          active ? `${color}` : 'bg-neutral-300'
        }`}
      />
      <div className="flex flex-col min-w-0">
        <span
          className={`font-sans text-[11px] tracking-wide transition-colors ${
            active ? 'text-neutral-900 font-medium' : 'text-neutral-500 group-hover:text-neutral-700'
          } ${warning && active ? 'text-orange-600' : ''}`}
        >
          {label}
        </span>
        {sublabel && active && (
          <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-wider mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </button>
  );
}

const GlobalStatsOverlay = React.memo(GlobalStatsOverlayInner);
export default GlobalStatsOverlay;
