'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, { useControl, MapRef } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArcLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import type { MapboxOverlayProps } from '@deck.gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

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

// ── Tooltip Type ───────────────────────────────────────────

interface TooltipInfo {
  x: number;
  y: number;
  mandate: string;
  entity: string;
  veracity: number;
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
    cables: true,
    railways: true,
    dataCenters: true,
    hexagons: true,
    ftas: false,
    defence: false,
    competitors: false,
    weaknesses: false,
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

    if (layers.ftas) {
      const allFtaCountries = [...new Set(FTA_AGREEMENTS.flatMap(f => f.countries))];
      map.setFilter('fta-fill', ['in', 'iso_3166_1_alpha_3', ...allFtaCountries]);
      map.setFilter('fta-outline', ['in', 'iso_3166_1_alpha_3', ...allFtaCountries]);
      map.setPaintProperty('fta-fill', 'fill-opacity', 0.25);
      map.setPaintProperty('fta-outline', 'line-opacity', 0.7);
    } else {
      map.setPaintProperty('fta-fill', 'fill-opacity', 0);
      map.setPaintProperty('fta-outline', 'line-opacity', 0);
    }
  }, [layers.ftas, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map.getLayer('defence-fill')) return;

    if (layers.defence) {
      const allDefenceCountries = [...new Set(DEFENCE_PARTNERSHIPS.flatMap(d => d.countries))];
      map.setFilter('defence-fill', ['in', 'iso_3166_1_alpha_3', ...allDefenceCountries]);
      map.setPaintProperty('defence-fill', 'fill-opacity', 0.2);
    } else {
      map.setPaintProperty('defence-fill', 'fill-opacity', 0);
    }
  }, [layers.defence, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map.getLayer('competitors-fill')) return;

    if (layers.competitors) {
      const allCompetitorCountries = [...new Set([...BRI_COUNTRIES, ...BRICS_MEMBERS, ...BRICS_PARTNERS])];
      map.setFilter('competitors-fill', ['in', 'iso_3166_1_alpha_3', ...allCompetitorCountries]);
      map.setPaintProperty('competitors-fill', 'fill-opacity', 0.2);
      map.setPaintProperty('competitors-fill', 'fill-color', [
        'case',
        ['in', ['get', 'iso_3166_1_alpha_3'], ['literal', BRICS_MEMBERS]],
        '#DC2626',
        '#525252',
      ]);
    } else {
      map.setPaintProperty('competitors-fill', 'fill-opacity', 0);
    }
  }, [layers.competitors, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map.getLayer('weakness-fill')) return;

    if (layers.weaknesses) {
      map.setFilter('weakness-fill', ['in', 'iso_3166_1_alpha_3', ...WEAKNESS_COUNTRIES]);
      map.setFilter('weakness-outline', ['in', 'iso_3166_1_alpha_3', ...WEAKNESS_COUNTRIES]);
      map.setPaintProperty('weakness-fill', 'fill-opacity', 0.3);
      map.setPaintProperty('weakness-outline', 'line-opacity', 0.8);
    } else {
      map.setPaintProperty('weakness-fill', 'fill-opacity', 0);
      map.setPaintProperty('weakness-outline', 'line-opacity', 0);
    }
  }, [layers.weaknesses, mapLoaded]);

  // ── deck.gl Layers ───────────────────────────────────────

  const deckLayers = useMemo(() => {
    return [
      // HexagonLayer — 3D demographic density
      new HexagonLayer<DemographicPoint>({
        id: 'hex-demographic',
        data: DEMOGRAPHIC_POINTS,
        visible: layers.hexagons,
        getPosition: (d: DemographicPoint) => [d[0], d[1]],
        getElevationWeight: (d: DemographicPoint) => d[2],
        getColorWeight: (d: DemographicPoint) => d[2],
        elevationScale: 1500,
        radius: 30000,
        extruded: true,
        pickable: false,
        coverage: 0.85,
        upperPercentile: 95,
        material: {
          ambient: 0.6,
          diffuse: 0.7,
          shininess: 40,
          specularColor: [51, 100, 170],
        },
        colorRange: [
          [1, 152, 189],
          [73, 227, 206],
          [216, 254, 181],
          [254, 237, 177],
          [254, 173, 84],
          [209, 55, 78],
        ],
        opacity: 0.7,
      }),

      // ArcLayer — Subsea cables
      new ArcLayer<SubseaCable>({
        id: 'arc-cables',
        data: SUBSEA_CABLES,
        visible: layers.cables,
        getSourcePosition: (d: SubseaCable) => d.source,
        getTargetPosition: (d: SubseaCable) => d.target,
        getSourceColor: (d: SubseaCable) => d.sourceColor,
        getTargetColor: (d: SubseaCable) => d.targetColor,
        getWidth: 3,
        getHeight: 0.4,
        greatCircle: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        onHover: (info: any) => {
          if (info.object) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || info.object.owner || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity || info.object.owner, info.object.name),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // PathLayer — Existing Railways (solid)
      new PathLayer<RailwayPath>({
        id: 'path-railways-existing',
        data: EXISTING_RAILWAYS,
        visible: layers.railways,
        getPath: (d: RailwayPath) => d.path,
        getColor: (d: RailwayPath) => d.color,
        getWidth: 3,
        widthMinPixels: 2,
        widthMaxPixels: 6,
        pickable: true,
        jointRounded: true,
        capRounded: true,
        onHover: (info: any) => {
          if (info.object) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity, info.object.name),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // PathLayer — Proposed Railways (dashed via PathStyleExtension)
      new (PathLayer as any)({
        id: 'path-railways-proposed',
        data: PROPOSED_RAILWAYS,
        visible: layers.railways,
        getPath: (d: RailwayPath) => d.path,
        getColor: (d: RailwayPath) => [...d.color, 180] as [number, number, number, number],
        getWidth: 3,
        widthMinPixels: 2,
        widthMaxPixels: 5,
        getDashArray: [8, 4],
        dashJustified: true,
        pickable: true,
        jointRounded: true,
        extensions: [new PathStyleExtension({ dash: true })],
        onHover: (info: any) => {
          if (info.object) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity, info.object.name),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // PathLayer — Missing Railways (Ghost Gray Dash)
      new (PathLayer as any)({
        id: 'path-railways-missing',
        data: MISSING_RAILWAYS,
        visible: layers.railways,
        getPath: (d: RailwayPath) => d.path,
        getColor: (d: RailwayPath) => [...d.color, 255] as [number, number, number, number],
        getWidth: 3,
        widthMinPixels: 2,
        widthMaxPixels: 5,
        getDashArray: [6, 6],
        dashJustified: true,
        pickable: true,
        jointRounded: true,
        extensions: [new PathStyleExtension({ dash: true })],
        onHover: (info: any) => {
          if (info.object) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity, info.object.name),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // ScatterplotLayer — Data Centers
      new ScatterplotLayer<DataCenterPoint>({
        id: 'scatter-datacenters',
        data: DATA_CENTERS,
        visible: layers.dataCenters,
        getPosition: (d: DataCenterPoint) => d.position,
        getFillColor: [0, 255, 200, 200],
        getLineColor: [0, 255, 200, 80],
        getRadius: 12000,
        radiusMinPixels: 4,
        radiusMaxPixels: 16,
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 255, 200, 120],
        onHover: (info: any) => {
          if (info.object) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || info.object.facility || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity || info.object.facility, info.object.facility),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

    ];
  }, [layers.cables, layers.railways, layers.dataCenters, layers.hexagons]);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="relative w-full h-full">
      {/* Layer Controls */}
      <GlobalStatsOverlay layers={layers} toggleLayer={toggleLayer} />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none p-2 bg-black border border-neutral-700 max-w-[260px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
        >
          <div className="font-sans font-bold uppercase tracking-widest text-[#EF4444] text-[9px] mb-1.5 leading-tight">
            G20 MANDATE: {tooltip.mandate}
          </div>
          <div className="font-sans font-bold uppercase tracking-widest text-neutral-400 text-[10px] mb-1.5">
            ENTITY: {tooltip.entity}
          </div>
          <div 
            className="font-sans font-bold uppercase tracking-widest text-[10px]"
            style={{ color: tooltip.veracity > 7.5 ? '#10B981' : (tooltip.veracity > 4.0 ? '#0EA5E9' : '#9CA3AF') }}
          >
            VERACITY: {tooltip.veracity.toFixed(1)} / 10.0
          </div>
        </div>
      )}

      {/* Reference Badge */}
      <div className="absolute bottom-4 right-4 z-30">
        <a
          href={REFERENCE_LINKS.gccRailway}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black border border-neutral-800 text-[9px] font-mono text-gray-400 hover:text-white transition-all uppercase tracking-widest"
        >
          <span className="w-1.5 h-1.5 bg-neutral-500" />
          GCC Railway Ref
        </a>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        onLoad={() => setMapLoaded(true)}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.2 }}
        maxPitch={60}
        fog={{
          range: [1, 10],
          color: '#0f172a',
          'horizon-blend': 0.08,
          'high-color': '#1e293b',
          'space-color': '#0f172a',
          'star-intensity': 0.15,
        }}
      >
        <DeckGLOverlay layers={deckLayers} />
      </Map>
    </div>
  );
}

const ImecMap = React.memo(ImecMapInner);
export default ImecMap;
