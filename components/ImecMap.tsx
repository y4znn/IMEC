'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, { useControl, MapRef } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { LightingEffect, AmbientLight, DirectionalLight } from '@deck.gl/core';
import type { MapboxOverlayProps } from '@deck.gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useImecLayers } from '@/hooks/useImecLayers';

import {
  SUBSEA_CABLES,
  EXISTING_RAILWAYS,
  PROPOSED_RAILWAYS,
  MISSING_RAILWAYS,
  DATA_CENTERS,
  DEMOGRAPHIC_POINTS,
  FTA_AGREEMENTS,
  DEFENCE_PARTNERSHIPS,
  BRI_COUNTRIES,
  BRICS_MEMBERS,
  BRICS_PARTNERS,
  WEAKNESS_COUNTRIES,
  REFERENCE_LINKS,
} from '@/data/imec-geo-constants';
import type { SubseaCable, RailwayPath, DataCenterPoint, DemographicPoint } from '@/data/imec-geo-constants';
import GlobalStatsOverlay from './GlobalStatsOverlay';
import type { LayerConfig } from './GlobalStatsOverlay';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// ── deck.gl Interleaved Overlay ────────────────────────────

function DeckGLOverlay(props: MapboxOverlayProps & { interleaved?: boolean }) {
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ ...props, interleaved: true })
  );
  overlay.setProps(props);
  return null;
}

// ── Lighting Configuration ────────────────────────────────
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const dirLight = new DirectionalLight({
  color: [255, 255, 255],
  intensity: 2.0,
  direction: [-3, -4, -1]
});

const lightingEffect = new LightingEffect({ ambientLight, dirLight });

// ── Tooltip Type ───────────────────────────────────────────

interface TooltipInfo {
  x: number;
  y: number;
  mandate: string;
  entity: string;
  veracity: number;
  customBody?: string;
}

interface ParsedIntel {
  score: number;
  snippet: string;
  title: string;
}

// ── Main Component ─────────────────────────────────────────

function ImecMapInner() {
  const mapRef = useRef<MapRef>(null);
  
  const [viewState, setViewState] = useState({
    longitude: 42.0,
    latitude: 28.0,
    zoom: 3.8,
    pitch: 45,
    bearing: -15,
  });

  const [layers, setLayers] = useState<LayerConfig>({
    imecCorridor: true,
    railways: true,
    subseaTelecom: true,
    blueCable: true,
    ramanCable: true,
    briCompetitor: false,
    geopolitical: false,
  });

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [intelArticles, setIntelArticles] = useState<ParsedIntel[]>([]);

  useEffect(() => {
    fetch('/data/verified_intel.md')
      .then(res => res.text())
      .then(text => {
        const parsed: ParsedIntel[] = [];
        const blocks = text.split(/(?=### \[)/);
        for (const block of blocks) {
          if (!block.trim().startsWith('### [')) continue;
          const scoreMatch = block.match(/\*\*Score:\*\* ([\d.]+)\/10\.0/);
          const scoreRegexFallback = block.match(/\*\*Score:\*\* ([\d.]+)\//);
          const score = scoreMatch ? parseFloat(scoreMatch[1]) : (scoreRegexFallback ? parseFloat(scoreRegexFallback[1]) : 0);
          const snippetMatch = block.match(/\*\*Snippet:\*\* _([\s\S]+?)_/);
          const snippet = snippetMatch ? snippetMatch[1].trim() : '';
          const titleMatch = block.match(/### \[[\w-]+\] (.+?)(?:\n|$)/);
          const title = titleMatch ? titleMatch[1].trim() : '';
          parsed.push({ score, snippet, title });
        }
        setIntelArticles(parsed);
      })
      .catch(err => console.error('Failed to load intel', err));
  }, []);

  const calculateVeracity = useCallback((entity: string, name: string) => {
    if (!intelArticles.length || !entity) return 2.1;
    const matches = intelArticles.filter(a => 
      (entity && (a.snippet.toLowerCase().includes(entity.toLowerCase()) || a.title.toLowerCase().includes(entity.toLowerCase()))) ||
      (name && (a.snippet.toLowerCase().includes(name.toLowerCase()) || a.title.toLowerCase().includes(name.toLowerCase())))
    );
    if (matches.length === 0) return 1.8;
    const avg = matches.reduce((sum, a) => sum + a.score, 0) / matches.length;
    return parseFloat(avg.toFixed(1));
  }, [intelArticles]);

  const toggleLayer = useCallback((key: keyof LayerConfig) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Mapbox Country Fill Layers ───────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();
    
    // Wait for style to load
    const setupLayers = () => {
      // Only add if not already present (prevents duplicate layer errors)
      if (map.getLayer('fta-fill')) return;

      // FTA fill layer
      map.addLayer({
        id: 'fta-fill',
        type: 'fill',
        source: 'composite',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ''],
        paint: {
          'fill-color': '#10B981',
          'fill-opacity': 0,
        },
      }, 'waterway');

      // FTA outline
      map.addLayer({
        id: 'fta-outline',
        type: 'line',
        source: 'composite',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ''],
        paint: {
          'line-color': '#10B981',
          'line-width': 1.5,
          'line-opacity': 0,
        },
      }, 'waterway');

      // Defence fill layer
      map.addLayer({
        id: 'defence-fill',
        type: 'fill',
        source: 'composite',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ''],
        paint: {
          'fill-color': '#EF4444',
          'fill-opacity': 0,
        },
      }, 'waterway');

      // Competitors fill (BRI + BRICS)
      map.addLayer({
        id: 'competitors-fill',
        type: 'fill',
        source: 'composite',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ''],
        paint: {
          'fill-color': '#7C3AED',
          'fill-opacity': 0,
        },
      }, 'waterway');

      // Weakness fill (Egypt, Turkey)
      map.addLayer({
        id: 'weakness-fill',
        type: 'fill',
        source: 'composite',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ''],
        paint: {
          'fill-color': '#EF4444',
          'fill-opacity': 0,
        },
      }, 'waterway');

      // Weakness outline
      map.addLayer({
        id: 'weakness-outline',
        type: 'line',
        source: 'composite',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1_alpha_3', ''],
        paint: {
          'line-color': '#F97316',
          'line-width': 2.5,
          'line-opacity': 0,
          'line-dasharray': [3, 2],
        },
      }, 'waterway');
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once('style.load', setupLayers);
    }
  }, [mapLoaded]);

  // ── Toggle Mapbox layers reactively ──────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map.getLayer('fta-fill')) return;

    if (layers.geopolitical) {
      const allFtaCountries = [...new Set(FTA_AGREEMENTS.flatMap(f => f.countries))];
      map.setFilter('fta-fill', ['in', 'iso_3166_1_alpha_3', ...allFtaCountries]);
      map.setFilter('fta-outline', ['in', 'iso_3166_1_alpha_3', ...allFtaCountries]);
      map.setPaintProperty('fta-fill', 'fill-opacity', 0.25);
      map.setPaintProperty('fta-outline', 'line-opacity', 0.7);
    } else {
      map.setPaintProperty('fta-fill', 'fill-opacity', 0);
      map.setPaintProperty('fta-outline', 'line-opacity', 0);
    }
  }, [layers.geopolitical, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map.getLayer('defence-fill')) return;

    if (layers.geopolitical) {
      const allDefenceCountries = [...new Set(DEFENCE_PARTNERSHIPS.flatMap(d => d.countries))];
      map.setFilter('defence-fill', ['in', 'iso_3166_1_alpha_3', ...allDefenceCountries]);
      map.setPaintProperty('defence-fill', 'fill-opacity', 0.2);
    } else {
      map.setPaintProperty('defence-fill', 'fill-opacity', 0);
    }
  }, [layers.geopolitical, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map.getLayer('competitors-fill')) return;

    if (layers.briCompetitor) {
      const allCompetitorCountries = [...new Set([...BRI_COUNTRIES, ...BRICS_MEMBERS, ...BRICS_PARTNERS])];
      map.setFilter('competitors-fill', ['in', 'iso_3166_1_alpha_3', ...allCompetitorCountries]);
      map.setPaintProperty('competitors-fill', 'fill-opacity', 0.2);
      map.setPaintProperty('competitors-fill', 'fill-color', [
        'case',
        ['in', ['get', 'iso_3166_1_alpha_3'], ['literal', BRICS_MEMBERS]],
        '#DC2626',
        '#475569',
      ]);
    } else {
      map.setPaintProperty('competitors-fill', 'fill-opacity', 0);
    }
  }, [layers.briCompetitor, mapLoaded]);



  const deckLayers = useImecLayers({ layers, intelArticles, calculateVeracity, setTooltip });

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="relative w-full h-full">
      {/* Layer Controls */}
      <GlobalStatsOverlay layers={layers} toggleLayer={toggleLayer} />

      <div className="absolute z-10 bottom-4 left-4 pointer-events-none">
          <div className="font-sans font-bold text-[#000000] text-[40px] uppercase tracking-tighter opacity-10">IMEC</div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none p-3 bg-white border border-[#000000] max-w-[280px]"
          style={{ left: tooltip.x + 15, top: tooltip.y - 15 }}
        >
          <div className="font-sans font-bold uppercase tracking-widest text-[#000000] text-[9px] mb-1.5 leading-tight">
            G20 MANDATE: {tooltip.mandate}
          </div>
          <div className="font-sans font-bold uppercase tracking-widest text-neutral-800 text-[10px] mb-1.5">
            ENTITY: {tooltip.entity}
          </div>
          <div 
            className="font-sans font-bold uppercase tracking-widest text-[10px] mb-2"
            style={{ color: tooltip.veracity > 7.5 ? '#065F46' : (tooltip.veracity > 4.0 ? '#C2410C' : '#475569') }}
          >
            VERACITY: {tooltip.veracity.toFixed(1)} / 10.0
          </div>
          {(tooltip as any).customBody && (
            <div className="font-sans font-bold text-[10px] text-[#000000] border-t border-neutral-300 pt-2 leading-relaxed">
              {(tooltip as any).customBody}
            </div>
          )}
        </div>
      )}

      {/* Reference Badge */}
      <div className="absolute bottom-4 right-4 z-30">
        <a
          href={REFERENCE_LINKS.gccRailway}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 text-[9px] font-mono text-neutral-500 hover:text-black transition-all uppercase tracking-widest"
        >
          <span className="w-1.5 h-1.5 bg-neutral-300" />
          GCC Railway Ref
        </a>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        onLoad={() => setMapLoaded(true)}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.2 }}
        maxPitch={60}
        fog={{
          range: [1, 10],
          color: '#f8fafc',
          'horizon-blend': 0.08,
          'high-color': '#f1f5f9',
          'space-color': '#f8fafc',
          'star-intensity': 0.0,
        }}
      >
        <DeckGLOverlay layers={deckLayers} effects={[lightingEffect]} />
      </Map>
    </div>
  );
}

const ImecMap = React.memo(ImecMapInner);
export default ImecMap;
