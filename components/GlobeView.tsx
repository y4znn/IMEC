'use client';

import React, { useRef, useMemo, useCallback } from 'react';

// Dynamic import handled in layout.tsx — this component is only loaded client-side.

/* ══════════════════════════════════════════════════════════
   COORDINATE DATA
   ══════════════════════════════════════════════════════════ */

const coords: Record<string, { lat: number; lng: number }> = {
    // IMEC Nodes
    mumbai: { lat: 18.94, lng: 72.83 },
    mundra: { lat: 22.74, lng: 69.72 },
    jebelAli: { lat: 25.01, lng: 55.06 },
    fujairah: { lat: 25.13, lng: 56.34 },
    riyadh: { lat: 24.71, lng: 46.67 },
    jordan: { lat: 29.53, lng: 35.0 },
    haifa: { lat: 32.81, lng: 34.99 },
    piraeus: { lat: 37.94, lng: 23.64 },
    marseille: { lat: 43.3, lng: 5.37 },
    // Blue-Raman
    oman: { lat: 23.58, lng: 58.38 },
    jeddah: { lat: 21.49, lng: 39.19 },
    aqaba: { lat: 29.53, lng: 35.0 },
    catania: { lat: 37.5, lng: 15.09 },
    genoa: { lat: 44.41, lng: 8.93 },
    // DRP
    alFaw: { lat: 29.97, lng: 48.47 },
    baghdad: { lat: 33.31, lng: 44.37 },
    mosul: { lat: 36.34, lng: 43.14 },
    ovakoy: { lat: 37.1, lng: 42.4 },
    mersin: { lat: 36.8, lng: 34.63 },
    // INSTC
    chabahar: { lat: 25.29, lng: 60.64 },
    tehran: { lat: 35.69, lng: 51.42 },
    baku: { lat: 40.41, lng: 49.87 },
    astrakhan: { lat: 46.35, lng: 48.04 },
    moscow: { lat: 55.76, lng: 37.62 },
    // Chokepoints
    babElMandeb: { lat: 12.58, lng: 43.33 },
    suezCanal: { lat: 30.46, lng: 32.35 },
};

/* ══════════════════════════════════════════════════════════
   ARC DATA (Corridors)
   ══════════════════════════════════════════════════════════ */

type ArcDatum = {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string;
    corridor: string;
    stroke: number;
    dashLength: number;
    dashGap: number;
    dashAnimateTime: number;
};

function makeArc(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    corridor: string,
    color: string,
    opts: { stroke?: number; dashLength?: number; dashGap?: number; animateTime?: number } = {}
): ArcDatum {
    return {
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        color,
        corridor,
        stroke: opts.stroke ?? 0.35,
        dashLength: opts.dashLength ?? 1, // Solid line if dashLength is large
        dashGap: opts.dashGap ?? 0,       // No gap
        dashAnimateTime: opts.animateTime ?? 0, // 0 means static
    };
}

const arcsData: ArcDatum[] = [
    // IMEC: Solid, continuous glowing steel-blue line
    makeArc(coords.mundra, coords.jebelAli, 'IMEC', 'rgba(56, 189, 248, 0.9)', { stroke: 0.6 }),
    makeArc(coords.haifa, coords.piraeus, 'IMEC', 'rgba(56, 189, 248, 0.9)', { stroke: 0.6 }),
    makeArc(coords.piraeus, coords.marseille, 'IMEC', 'rgba(56, 189, 248, 0.9)', { stroke: 0.6 }),
    makeArc(coords.jebelAli, coords.riyadh, 'IMEC', 'rgba(56, 189, 248, 0.9)', { stroke: 0.6 }),
    makeArc(coords.riyadh, coords.jordan, 'IMEC', 'rgba(56, 189, 248, 0.9)', { stroke: 0.6 }),
    makeArc(coords.jordan, coords.haifa, 'IMEC', 'rgba(56, 189, 248, 0.9)', { stroke: 0.6 }),

    // Blue-Raman: Fast-moving dashed purple line
    makeArc(coords.mumbai, coords.oman, 'Blue-Raman', 'rgba(192, 132, 252, 0.9)', { stroke: 0.4, dashLength: 0.1, dashGap: 0.1, animateTime: 1200 }),
    makeArc(coords.oman, coords.jeddah, 'Blue-Raman', 'rgba(192, 132, 252, 0.9)', { stroke: 0.4, dashLength: 0.1, dashGap: 0.1, animateTime: 1200 }),
    makeArc(coords.jeddah, coords.aqaba, 'Blue-Raman', 'rgba(192, 132, 252, 0.9)', { stroke: 0.4, dashLength: 0.1, dashGap: 0.1, animateTime: 1200 }),
    makeArc(coords.aqaba, coords.haifa, 'Blue-Raman', 'rgba(192, 132, 252, 0.9)', { stroke: 0.4, dashLength: 0.1, dashGap: 0.1, animateTime: 1200 }),
    makeArc(coords.haifa, coords.genoa, 'Blue-Raman', 'rgba(192, 132, 252, 0.9)', { stroke: 0.4, dashLength: 0.1, dashGap: 0.1, animateTime: 1200 }),

    // DRP: Static, dotted muted-amber
    makeArc(coords.alFaw, coords.baghdad, 'DRP', 'rgba(217, 119, 6, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),
    makeArc(coords.baghdad, coords.mosul, 'DRP', 'rgba(217, 119, 6, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),
    makeArc(coords.mosul, coords.ovakoy, 'DRP', 'rgba(217, 119, 6, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),
    makeArc(coords.ovakoy, coords.mersin, 'DRP', 'rgba(217, 119, 6, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),

    // INSTC: Static, dotted rose
    makeArc(coords.mumbai, coords.chabahar, 'INSTC', 'rgba(225, 29, 72, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),
    makeArc(coords.chabahar, coords.tehran, 'INSTC', 'rgba(225, 29, 72, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),
    makeArc(coords.tehran, coords.baku, 'INSTC', 'rgba(225, 29, 72, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),
    makeArc(coords.baku, coords.astrakhan, 'INSTC', 'rgba(225, 29, 72, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),
    makeArc(coords.astrakhan, coords.moscow, 'INSTC', 'rgba(225, 29, 72, 0.7)', { stroke: 0.3, dashLength: 0.05, dashGap: 0.05 }),
];

/* ══════════════════════════════════════════════════════════
   HTML ELEMENTS (3D Floating Labels)
   ══════════════════════════════════════════════════════════ */

const htmlElementsData = [
    { lat: 21.0, lng: 51.0, label: 'IMEC', color: '#38bdf8' },
    { lat: 27.5, lng: 38.0, label: 'Blue-Raman', color: '#c084fc' },
    { lat: 33.5, lng: 45.5, label: 'DRP', color: '#fbbf24' },
    { lat: 40.5, lng: 55.0, label: 'INSTC', color: '#fb7185' },
];

/* ══════════════════════════════════════════════════════════
   POINT DATA (Node Markers)
   ══════════════════════════════════════════════════════════ */

type PointDatum = {
    lat: number;
    lng: number;
    name: string;
    color: string;
    size: number;
};

const pointsData: PointDatum[] = [
    ...Object.entries(coords).map(([k, v]) => ({
        ...v,
        name: k,
        color: 'rgba(255, 255, 255, 0.6)',
        size: 0.08,
    }))
];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

// We use require() since react-globe.gl doesn't have great ESM support and is loaded dynamically anyway
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Globe = require('react-globe.gl').default;

export default function GlobeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globeRef = useRef<any>(null);

    // Set initial camera position once globe is ready
    const handleGlobeReady = useCallback(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            if (controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.5;
                controls.enableZoom = true;
                controls.minDistance = 150;
                controls.maxDistance = 400;
                controls.zoomSpeed = 0.6;
            }
            // Point camera toward Middle East / IMEC region
            globeRef.current.pointOfView({ lat: 28, lng: 46, altitude: 1.8 }, 1500);
        }
    }, []);

    const memoArcs = useMemo(() => arcsData, []);
    const memoPoints = useMemo(() => pointsData, []);
    const memoHtmlLabels = useMemo(() => htmlElementsData, []);

    return (
        <div className="w-full h-full relative bg-zinc-950">
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                showAtmosphere={true}
                atmosphereColor="#ffffff"
                atmosphereAltitude={0.1}
                animateIn={true}
                onGlobeReady={handleGlobeReady}

                // ── Arcs (Corridors) ──
                arcsData={memoArcs}
                arcStartLat="startLat"
                arcStartLng="startLng"
                arcEndLat="endLat"
                arcEndLng="endLng"
                arcColor="color"
                arcStroke="stroke"
                arcDashLength="dashLength"
                arcDashGap="dashGap"
                arcDashAnimateTime="dashAnimateTime"

                // ── Points (Node Markers) ──
                pointsData={memoPoints}
                pointLat="lat"
                pointLng="lng"
                pointColor="color"
                pointAltitude={0.01}
                pointRadius="size"

                // ── HTML Floating Labels ──
                htmlElementsData={memoHtmlLabels}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={() => 0.05}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                htmlElement={(d: any) => {
                    const el = document.createElement('div');
                    el.innerHTML = d.label;
                    el.style.color = d.color;
                    el.style.fontSize = '10px';
                    el.style.fontFamily = 'Inter, sans-serif';
                    el.style.fontWeight = '500';
                    el.style.letterSpacing = '0.05em';
                    el.style.padding = '3px 8px';
                    el.style.borderRadius = '6px';
                    el.style.backgroundColor = 'rgba(9, 9, 11, 0.4)';
                    el.style.backdropFilter = 'blur(8px)';
                    el.style.border = `1px solid ${d.color}30`;
                    el.style.pointerEvents = 'none';
                    el.style.whiteSpace = 'nowrap';
                    el.style.boxShadow = `0 4px 12px ${d.color}10`;
                    return el;
                }}
            />

            {/* ── Route Legend ── */}
            <div className="absolute bottom-10 left-10 z-20 pointer-events-auto">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-2xl flex flex-col gap-3">
                    <h3 className="text-zinc-100 text-xs font-semibold tracking-wider uppercase mb-1">Infrastructure Corridors</h3>

                    {[
                        { color: '#38bdf8', label: 'IMEC', desc: 'Sovereign Backbone', style: 'solid' },
                        { color: '#c084fc', label: 'Blue-Raman', desc: 'Digital Artery', style: 'dashed' },
                        { color: '#d97706', label: 'DRP', desc: 'Regional Rival', style: 'dotted' },
                        { color: '#e11d48', label: 'INSTC', desc: 'Eurasian Axis', style: 'dotted' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-4">
                            <div className="w-8 flex items-center justify-center">
                                {item.style === 'solid' && <div className="h-0.5 w-full rounded-full" style={{ background: item.color }} />}
                                {item.style === 'dashed' && (
                                    <div className="w-full flex justify-between">
                                        <div className="h-0.5 w-[30%] rounded-full" style={{ background: item.color }} />
                                        <div className="h-0.5 w-[30%] rounded-full" style={{ background: item.color }} />
                                    </div>
                                )}
                                {item.style === 'dotted' && (
                                    <div className="w-full flex justify-between px-1">
                                        <div className="h-1 w-1 rounded-full" style={{ background: item.color }} />
                                        <div className="h-1 w-1 rounded-full" style={{ background: item.color }} />
                                        <div className="h-1 w-1 rounded-full" style={{ background: item.color }} />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-medium text-zinc-200">{item.label}</span>
                                <span className="text-[10px] text-zinc-500">{item.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
