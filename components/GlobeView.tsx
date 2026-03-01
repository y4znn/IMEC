'use client';

import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { X } from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   COORDINATE DATA
   ══════════════════════════════════════════════════════════ */

const coords: Record<string, { lat: number; lng: number; label: string; desc: string; type: string }> = {
    // IMEC Nodes
    mumbai: { lat: 18.94, lng: 72.83, label: 'MUMBAI (JNPT)', desc: 'Primary maritime exit node on India\'s west coast.', type: 'Logistics' },
    mundra: { lat: 22.74, lng: 69.72, label: 'MUNDRA PORT', desc: 'Major commercial port in Gujarat.', type: 'Logistics' },
    jebelAli: { lat: 25.01, lng: 55.06, label: 'JEBEL ALI', desc: 'The largest port in the Middle East.', type: 'Logistics' },
    fujairah: { lat: 25.13, lng: 56.34, label: 'FUJAIRAH', desc: 'Key bunkering and transshipment hub bypassing Hormuz.', type: 'Logistics' },
    riyadh: { lat: 24.71, lng: 46.67, label: 'RIYADH', desc: 'Central overland rail integration node.', type: 'Logistics' },
    jordan: { lat: 29.53, lng: 35.0, label: 'JORDAN HUB', desc: 'Critical transit bridging the Gulf and Israel.', type: 'Logistics' },
    haifa: { lat: 32.81, lng: 34.99, label: 'HAIFA PORT', desc: 'Critical Mediterranean gateway, acquired by Adani.', type: 'Logistics' },
    piraeus: { lat: 37.94, lng: 23.64, label: 'PIRAEUS', desc: 'Major European entry, controlled by COSCO.', type: 'Logistics' },
    marseille: { lat: 43.3, lng: 5.37, label: 'MARSEILLE', desc: 'Key European terminus for shipping and cables.', type: 'Logistics' },
    // DRP
    alFaw: { lat: 29.97, lng: 48.47, label: 'AL FAW', desc: 'Grand port under construction in Iraq.', type: 'Logistics' },
    baghdad: { lat: 33.31, lng: 44.37, label: 'BAGHDAD', desc: 'Central hub for Iraqi Development Road.', type: 'Logistics' },
    mersin: { lat: 36.8, lng: 34.63, label: 'MERSIN', desc: 'Turkish Mediterranean port.', type: 'Logistics' },
};

/* ══════════════════════════════════════════════════════════
   ARC DATA (Corridors)
   ══════════════════════════════════════════════════════════ */
const PALETTE = {
    IMEC: '#4A90E2',
    BRI: '#E24A4A',
    INSTC: '#3D4B3D',
    NEUTRAL: '#444444'
};

type ArcDatum = {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string;
    corridor: string;
    stroke: number;
    dashLength: number;
    dashGap: number; // 0 for solid
    dashAnimateTime: number; // 0 for static
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
        stroke: opts.stroke ?? 0.5,
        dashLength: opts.dashLength ?? 1,
        dashGap: opts.dashGap ?? 0,
        dashAnimateTime: opts.animateTime ?? 0,
    };
}

const arcsData: ArcDatum[] = [
    // 1. IMEC: Slate Blue (#2C3E50) - Dashed/Static
    makeArc(coords.mumbai, coords.jebelAli, 'IMEC', PALETTE.IMEC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc(coords.mundra, coords.jebelAli, 'IMEC', PALETTE.IMEC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc(coords.haifa, coords.piraeus, 'IMEC', PALETTE.IMEC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc(coords.piraeus, coords.marseille, 'IMEC', PALETTE.IMEC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc(coords.jebelAli, coords.riyadh, 'IMEC', PALETTE.IMEC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc(coords.riyadh, coords.jordan, 'IMEC', PALETTE.IMEC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc(coords.jordan, coords.haifa, 'IMEC', PALETTE.IMEC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),

    // 2. BRI: Muted Oxblood (#4A1F1F)
    makeArc({ lat: 43.82, lng: 87.61 }, { lat: 43.23, lng: 76.88 }, 'BRI', PALETTE.BRI, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc({ lat: 43.23, lng: 76.88 }, { lat: 39.62, lng: 66.97 }, 'BRI', PALETTE.BRI, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc({ lat: 39.62, lng: 66.97 }, { lat: 35.69, lng: 51.42 }, 'BRI', PALETTE.BRI, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc({ lat: 35.69, lng: 51.42 }, { lat: 41.00, lng: 28.97 }, 'BRI', PALETTE.BRI, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),

    // 3. INSTC: Desaturated Sage (#3D4B3D)
    makeArc(coords.mumbai, { lat: 25.29, lng: 60.64 }, 'INSTC', PALETTE.INSTC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc({ lat: 25.29, lng: 60.64 }, { lat: 35.69, lng: 51.42 }, 'INSTC', PALETTE.INSTC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),
    makeArc({ lat: 35.69, lng: 51.42 }, { lat: 40.41, lng: 49.87 }, 'INSTC', PALETTE.INSTC, { stroke: 0.5, dashLength: 0.05, dashGap: 0.02, animateTime: 0 }),

    // 4. DRP: Neutral Grey
    makeArc(coords.alFaw, coords.baghdad, 'DRP', PALETTE.NEUTRAL, { stroke: 0.4, dashLength: 0.02, dashGap: 0.02 }),
    makeArc(coords.baghdad, coords.mersin, 'DRP', PALETTE.NEUTRAL, { stroke: 0.4, dashLength: 0.02, dashGap: 0.02 }),
];

/* ══════════════════════════════════════════════════════════
   HTML ELEMENTS (Tags & Ghost Layers)
   ══════════════════════════════════════════════════════════ */

interface HtmlElementDatum {
    isGhost?: boolean;
    lat: number;
    lng: number;
    label: string;
    desc?: string;
    type?: string;
    coord?: string;
    id?: string;
}

const htmlElementsData: HtmlElementDatum[] = [
    // Ghost layers
    { isGhost: true, lat: 22, lng: 78, label: 'I N D I A' },
    { isGhost: true, lat: 24, lng: 45, label: 'S A U D I   A R A B I A' },
    { isGhost: true, lat: 31, lng: 35, label: 'I S R A E L' },
    { isGhost: true, lat: 39, lng: 22, label: 'G R E E C E' },
    { isGhost: true, lat: 50, lng: 20, label: 'E U R O P E' },
    { isGhost: true, lat: 35, lng: 104, label: 'C H I N A' },
    { isGhost: true, lat: 33, lng: 43, label: 'I R A Q' },

    // Explicit Node Tags
    ...Object.entries(coords).map(([k, v]) => ({
        id: k,
        isGhost: false,
        lat: v.lat,
        lng: v.lng,
        label: v.label,
        desc: v.desc,
        type: v.type,
        coord: `${v.lat.toFixed(2)}° N, ${v.lng.toFixed(2)}° E`
    }))
];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Globe = require('react-globe.gl').default;

export default function GlobeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globeRef = useRef<any>(null);
    const [countries, setCountries] = useState({ features: [] });
    const [selectedNode, setSelectedNode] = useState<HtmlElementDatum | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [paperMaterial, setPaperMaterial] = useState<any>(null);

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(data => setCountries(data.features || []))
            .catch(console.error);

        let isMounted = true;
        import('three').then((THREE) => {
            if (!isMounted) return;
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color('#000000'),
                transparent: true,
                opacity: 0.8,
            });
            setPaperMaterial(mat);
        });
        return () => { isMounted = false; };
    }, []);

    const handleGlobeReady = useCallback(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            if (controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.2; // Slower, more academic
                controls.enableZoom = true;
                controls.minDistance = 150;
                controls.maxDistance = 600;
                controls.zoomSpeed = 0.6;
            }
            globeRef.current.pointOfView({ lat: 28, lng: 46, altitude: 2.0 }, 1500);

            // Eradicate default lighting for strict wireframe/blueprint look
            const scene = globeRef.current.scene();
            import('three').then((THREE) => {
                // Remove default lights
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lightsToRemove = scene.children.filter((c: any) => c.isLight);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                lightsToRemove.forEach((l: any) => scene.remove(l));

                // Set globe base completely transparent to reveal background
                const globeMaterial = globeRef.current.globeMaterial();
                if (globeMaterial) {
                    globeRef.current.globeMaterial(new THREE.MeshBasicMaterial({
                        transparent: true,
                        opacity: 0
                    }));
                }

                // Force Flat Colors on Arcs via traversal (since react-globe uses generic materials for paths)
                setTimeout(() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    scene.traverse((child: any) => {
                        if (child.isMesh && child.material && child.__data && child.__data.corridor) {
                            if (child.__data.color) {
                                child.material = new THREE.MeshBasicMaterial({
                                    color: new THREE.Color(child.__data.color),
                                    transparent: true,
                                    opacity: 1.0,
                                });
                            }
                        }
                    });
                }, 500); // Small delay to ensure geometries construct
            });
        }
    }, []);

    const memoArcs = useMemo(() => arcsData, []);
    const memoHtmlLabels = useMemo(() => htmlElementsData, []);

    return (
        <div className="w-full h-full relative bg-black font-serif">
            {/* NO ATMOSPHERE, NO NEON, NO EXTERNAL IMAGES */}
            <Globe
                ref={globeRef}
                globeImageUrl={undefined}
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                showAtmosphere={false}
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

                polygonsData={countries}
                polygonCapMaterial={paperMaterial}
                polygonSideColor={() => 'rgba(0,0,0,0)'}
                polygonStrokeColor={() => '#A3A3A3'}
                polygonAltitude={0.005}

                // ── HTML Overlays ──
                htmlElementsData={memoHtmlLabels}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={() => 0.05}
                htmlElement={(d: HtmlElementDatum) => {
                    const container = document.createElement('div');

                    if (d.isGhost) {
                        // Ghost Layer Format
                        container.innerHTML = d.label;
                        container.style.color = '#ffffff';
                        container.style.fontSize = '32px';
                        container.style.fontFamily = '"Fraunces", "Libre Baskerville", serif';
                        container.style.fontWeight = '700';
                        container.style.letterSpacing = '0.5em';
                        container.style.opacity = '0.03';
                        container.style.whiteSpace = 'nowrap';
                        container.style.pointerEvents = 'none';
                        return container;
                    }

                    // Standard Node Format
                    container.style.display = 'flex';
                    container.style.flexDirection = 'column';
                    container.style.alignItems = 'center';
                    container.style.pointerEvents = 'auto';
                    container.style.cursor = 'pointer';

                    container.onclick = (e) => {
                        e.stopPropagation();
                        setSelectedNode(d);
                    };

                    const tag = document.createElement('div');
                    tag.innerHTML = d.label;
                    tag.style.color = '#ffffff';
                    tag.style.fontSize = '9px';
                    tag.style.fontFamily = '"IBM Plex Mono", "JetBrains Mono", monospace';
                    tag.style.fontWeight = '500';
                    tag.style.letterSpacing = '0.1em';
                    tag.style.padding = '3px 6px';
                    tag.style.borderRadius = '0px'; // Strict 90 degree
                    tag.style.backgroundColor = '#000000';
                    tag.style.border = `1px solid #333333`;
                    tag.style.whiteSpace = 'nowrap';
                    tag.style.textTransform = 'uppercase';

                    const coordsEl = document.createElement('div');
                    coordsEl.innerHTML = d.coord || '';
                    coordsEl.style.color = '#888888';
                    coordsEl.style.fontSize = '6px';
                    coordsEl.style.fontFamily = '"IBM Plex Mono", "JetBrains Mono", monospace';
                    coordsEl.style.paddingTop = '4px';

                    container.appendChild(tag);
                    container.appendChild(coordsEl);

                    return container;
                }}
            />

            {/* ── Route Legend ── */}
            <div className="absolute bottom-8 left-8 z-20 pointer-events-auto border border-white/20 bg-black px-6 py-5" style={{ borderRadius: 0 }}>
                <h3 className="text-white text-[10px] tracking-[0.2em] font-mono uppercase mb-4">Cartographic Lexicon</h3>

                {[
                    { color: PALETTE.IMEC, label: 'IMEC', desc: 'Sovereign Backbone', style: 'dashed' },
                    { color: PALETTE.BRI, label: 'BRI', desc: 'Chinese Vanguard', style: 'dashed' },
                    { color: PALETTE.INSTC, label: 'INSTC', desc: 'Russo-Iranian Axis', style: 'dashed' },
                    { color: PALETTE.NEUTRAL, label: 'DRP', desc: 'Regional Bypass', style: 'dashed' },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 mb-3 last:mb-0">
                        <div className="w-8 flex justify-between items-center shrink-0 opacity-80">
                            <div className="h-px w-[30%]" style={{ background: item.color }} />
                            <div className="h-px w-[30%]" style={{ background: item.color }} />
                            <div className="h-px w-[30%]" style={{ background: item.color }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] text-white font-mono uppercase tracking-widest">{item.label}</span>
                            <span className="text-[9px] text-white/50 font-serif" style={{ letterSpacing: '-0.02em' }}>{item.desc}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── DOSSIER PANEL (Right) ── */}
            {selectedNode && (
                <div className="absolute right-0 top-0 w-[400px] h-screen bg-black border-l border-white z-40 overflow-y-auto pointer-events-auto shadow-2xl"
                    style={{ borderRadius: 0 }}>

                    <div className="px-8 pt-24 pb-8">
                        {/* Close */}
                        <button onClick={() => setSelectedNode(null)}
                            className="absolute top-20 right-6 text-white/30 hover:text-white transition-colors cursor-pointer">
                            <X className="w-5 h-5" strokeWidth={1} />
                        </button>

                        {/* Type Badge */}
                        <div className="inline-flex items-center gap-2 border border-white px-3 py-1 mb-4 bg-black"
                            style={{ borderRadius: 0 }}>
                            <span className="text-[10px] font-black font-mono text-white">
                                +
                            </span>
                            <span className="text-[10px] tracking-[0.3em] uppercase font-mono text-white">
                                {selectedNode.type || 'NODE'}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-white leading-tight mb-2 font-serif uppercase tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            {selectedNode.label.replace(/-/g, ' ')}
                        </h2>
                        {selectedNode.coord && (
                            <div className="text-[10px] text-white/50 font-mono tracking-widest mb-6">
                                {selectedNode.coord}
                            </div>
                        )}
                        {!selectedNode.coord && <div className="mb-6" />}

                        {/* Divider */}
                        <div className="w-full h-px bg-white/20 mb-6" />

                        {/* Desc */}
                        <div className="mb-8">
                            <div className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2 font-mono">
                                Intelligence Brief
                            </div>
                            <p className="text-[14px] text-white/70 leading-relaxed font-serif">
                                {selectedNode.desc || "Verified geospatial transit anchor within the defined corridor matrices."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
