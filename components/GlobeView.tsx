'use client';

import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import * as d3 from 'd3';
import * as THREE from 'three';

function getCoords(lat: number, lng: number, alt = 0) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (90 - lng) * Math.PI / 180;
    const r = 100 * (1 + alt);
    return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
}

/* ══════════════════════════════════════════════════════════
   COORDINATE DATA
   ══════════════════════════════════════════════════════════ */

interface CoordinateNode {
    lat: number;
    lng: number;
    label: string;
    desc: string;
    type: string;
}

const coords: Record<string, CoordinateNode> = {
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
    MARITIME: '#3B82F6', // Blue Dashed
    OVERLAND: '#FF3B30', // Vivid Crimson Solid
    RIVAL: '#10B981',    // Green
};

interface ArcDatum {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string;
    corridor: string;
    isSolid: boolean;
}

function makeArc(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    corridor: string,
    color: string,
    opts: { isSolid?: boolean } = {}
): ArcDatum {
    return {
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        color,
        corridor,
        isSolid: opts.isSolid ?? false,
    };
}

const arcsData: ArcDatum[] = [
    // 1. MARITIME: Blue Dashed
    makeArc(coords.mumbai, coords.jebelAli, 'IMEC', PALETTE.MARITIME, { isSolid: false }),
    makeArc(coords.mundra, coords.jebelAli, 'IMEC', PALETTE.MARITIME, { isSolid: false }),
    makeArc(coords.haifa, coords.piraeus, 'IMEC', PALETTE.MARITIME, { isSolid: false }),
    makeArc(coords.piraeus, coords.marseille, 'IMEC', PALETTE.MARITIME, { isSolid: false }),

    // 2. OVERLAND: Red Solid
    makeArc(coords.jebelAli, coords.riyadh, 'IMEC', PALETTE.OVERLAND, { isSolid: true }),
    makeArc(coords.riyadh, coords.jordan, 'IMEC', PALETTE.OVERLAND, { isSolid: true }),
    makeArc(coords.jordan, coords.haifa, 'IMEC', PALETTE.OVERLAND, { isSolid: true }),

    // 3. RIVAL: Green Solid
    makeArc({ lat: 43.82, lng: 87.61 }, { lat: 43.23, lng: 76.88 }, 'BRI', PALETTE.RIVAL, { isSolid: true }),
    makeArc({ lat: 43.23, lng: 76.88 }, { lat: 39.62, lng: 66.97 }, 'BRI', PALETTE.RIVAL, { isSolid: true }),
    makeArc({ lat: 39.62, lng: 66.97 }, { lat: 35.69, lng: 51.42 }, 'BRI', PALETTE.RIVAL, { isSolid: true }),
    makeArc({ lat: 35.69, lng: 51.42 }, { lat: 41.00, lng: 28.97 }, 'BRI', PALETTE.RIVAL, { isSolid: true }),
    makeArc(coords.mumbai, { lat: 25.29, lng: 60.64 }, 'INSTC', PALETTE.RIVAL, { isSolid: true }),
    makeArc({ lat: 25.29, lng: 60.64 }, { lat: 35.69, lng: 51.42 }, 'INSTC', PALETTE.RIVAL, { isSolid: true }),
    makeArc({ lat: 35.69, lng: 51.42 }, { lat: 40.41, lng: 49.87 }, 'INSTC', PALETTE.RIVAL, { isSolid: true }),
    makeArc(coords.alFaw, coords.baghdad, 'DRP', PALETTE.RIVAL, { isSolid: true }),
    makeArc(coords.baghdad, coords.mersin, 'DRP', PALETTE.RIVAL, { isSolid: true }),
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
    x?: number;
    y?: number;
    d3x?: number;
    d3y?: number;
}

const htmlElementsData: HtmlElementDatum[] = [
    // Ghost layers
    { isGhost: true, lat: 22, lng: 78, label: 'I N D I A' },
    { isGhost: true, lat: 24, lng: 54, label: 'U N I T E D   A R A B   E M I R A T E S' },
    { isGhost: true, lat: 24, lng: 45, label: 'S A U D I   A R A B I A' },
    { isGhost: true, lat: 31, lng: 36, label: 'J O R D A N' },
    { isGhost: true, lat: 31.5, lng: 34.7, label: 'I S R A E L' },
    { isGhost: true, lat: 39, lng: 22, label: 'G R E E C E' },
    { isGhost: true, lat: 42, lng: 12, label: 'I T A L Y' },
    { isGhost: true, lat: 46, lng: 2, label: 'F R A N C E' },

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

interface GeoJsonFeature {
    type: string;
    geometry: { type: string; coordinates: number[] };
    properties: Record<string, unknown>;
}

interface GlobeMethods {
    controls: () => { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean; minDistance: number; maxDistance: number; zoomSpeed: number; };
    pointOfView: (pov: { lat: number; lng: number; altitude: number }, ms?: number) => void;
    scene: () => THREE.Scene;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Globe = require('react-globe.gl').default;

export default function GlobeView() {
    const globeRef = useRef<GlobeMethods | null>(null);
    const [countries, setCountries] = useState<GeoJsonFeature[]>([]);
    const [selectedNode, setSelectedNode] = useState<HtmlElementDatum | null>(null);
    const [isRotating, setIsRotating] = useState(true);
    const [d3Labels, setD3Labels] = useState<HtmlElementDatum[]>(htmlElementsData.filter(d => !d.isGhost));
    const ghostLabels = useMemo(() => htmlElementsData.filter(d => d.isGhost), []);

    // A11y Focus Trap Refs
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    // React Closure Trap Fix
    const stateRef = useRef({ selectedNode, isRotating });
    useEffect(() => {
        stateRef.current = { selectedNode, isRotating };
    }, [selectedNode, isRotating]);

    // DPI Scaling State
    const [dppx, setDppx] = useState(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const updateDppx = () => setDppx(window.devicePixelRatio || 1);
        const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        mql.addEventListener('change', updateDppx);
        return () => mql.removeEventListener('change', updateDppx);
    }, [dppx]); // need it to re-bind if devicePixelRatio changes

    // A11y Focus Trap Effects
    useEffect(() => {
        if (selectedNode) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            setTimeout(() => closeBtnRef.current?.focus(), 50);
        } else if (previousFocusRef.current) {
            previousFocusRef.current.focus();
        }
    }, [selectedNode]);

    const handlePanelKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Tab' && panelRef.current) {
            const focusable = panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable && focusable.length > 0) {
                const firstElement = focusable[0] as HTMLElement;
                const lastElement = focusable[focusable.length - 1] as HTMLElement;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        }
    }, []);

    // WebGL Garbage Collection
    useEffect(() => {
        return () => {
            if (globeRef.current) {
                const scene = globeRef.current.scene();
                if (scene) {
                    scene.traverse((child: any) => {
                        if (child.type === 'Line') {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach((m: any) => m.dispose());
                                } else {
                                    child.material.dispose();
                                }
                            }
                        }
                    });
                }
            }
        };
    }, []);

    const paperMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        color: new THREE.Color('#F9FAFB'),
        transparent: true,
        opacity: 0.8,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    }), []);

    const emptyMaterial = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), []);

    useEffect(() => {
        const controller = new AbortController();
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson', { signal: controller.signal })
            .then(res => res.json())
            .then(data => setCountries(data.features || []))
            .catch(err => {
                if (err.name !== 'AbortError') console.error('Failed to fetch geojson', err);
            });
        return () => controller.abort();
    }, []);

    const handleGlobeReady = useCallback(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            if (controls) {
                controls.autoRotate = isRotating;
                controls.autoRotateSpeed = 0.2; // Slower, more academic
                controls.enableZoom = true;
                controls.minDistance = 150;
                controls.maxDistance = 600;
                controls.zoomSpeed = 0.6;
            }
            globeRef.current.pointOfView({ lat: 25.0, lng: 45.0, altitude: 1.2 }, 1500);

            // Eradicate default lighting for strict wireframe/blueprint look
            const scene = globeRef.current.scene();
            const lightsToRemove = scene.children.filter((c: THREE.Object3D) => c.type.includes('Light'));
            lightsToRemove.forEach((l: THREE.Object3D) => scene.remove(l));
        }
    }, [isRotating]);

    useEffect(() => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            if (controls) {
                controls.autoRotate = isRotating;
            }
        }
    }, [isRotating]);

    const handleZoom = useCallback((pov: { altitude: number }) => {
        // Base scaling factor inversely proportional to altitude, with min and max bounds
        const scale = Math.max(0.4, Math.min(1.5, 1.2 / pov.altitude));
        document.documentElement.style.setProperty('--globe-label-scale', scale.toString());
        document.documentElement.style.setProperty('--globe-dot-scale', Math.max(0.2, scale * 0.5).toString());

        // Exact pixel offset projection scale for mathematically tethered D3 offsets
        const offsetScale = 1.2 / Math.max(pov.altitude, 0.1);
        document.documentElement.style.setProperty('--globe-offset-scale', offsetScale.toString());
    }, []);

    const memoArcs = useMemo(() => arcsData, []);

    // Asynchronous D3 Force Simulation Worker
    useEffect(() => {
        const labelsToCollide = htmlElementsData.filter(d => !d.isGhost).map(d => ({
            ...d,
            x: d.lng,
            y: d.lat,
            vx: 0,
            vy: 0
        }));

        const simulation = d3.forceSimulation(labelsToCollide as d3.SimulationNodeDatum[])
            .force('collide', d3.forceCollide(10).iterations(4))
            .force('x', d3.forceX((d: d3.SimulationNodeDatum & HtmlElementDatum) => d.lng).strength(0.08))
            .force('y', d3.forceY((d: d3.SimulationNodeDatum & HtmlElementDatum) => d.lat).strength(0.08))
            .stop();

        let ticks = 0;
        const totalTicks = 150;
        let frameId: number;

        const tickChunk = () => {
            for (let i = 0; i < 15; i++) {
                if (ticks >= totalTicks) break;
                simulation.tick();
                ticks++;
            }
            if (ticks < totalTicks) {
                frameId = requestAnimationFrame(tickChunk);
            } else {
                const adjustedMap = new Map();
                labelsToCollide.forEach((node: d3.SimulationNodeDatum & HtmlElementDatum) => {
                    adjustedMap.set(node.id, {
                        ...node,
                        lng: node.lng,
                        lat: node.lat,
                        d3x: node.x,
                        d3y: node.y
                    });
                });

                setD3Labels(htmlElementsData.filter(d => !d.isGhost).map(d => {
                    if (!d.id) return d;
                    return adjustedMap.get(d.id) || d;
                }));
            }
        };

        frameId = requestAnimationFrame(tickChunk);
        return () => cancelAnimationFrame(frameId);
    }, []);

    return (
        <div className="w-full h-full relative bg-gray-50 font-serif">
            {/* NO ATMOSPHERE, NO NEON, NO EXTERNAL IMAGES */}
            <button
                onClick={() => setIsRotating(prev => !prev)}
                className="absolute top-24 right-6 z-40 bg-gray-50 border border-gray-400/30 text-gray-900/70 hover:text-gray-900 hover:border-gray-400 text-[10px] tracking-widest uppercase font-mono px-3 py-1.5 transition-all"
                style={{ borderRadius: 0 }}
            >
                [ {isRotating ? 'PAUSE ROTATION' : 'RESUME ROTATION'} ]
            </button>
            <Globe
                ref={globeRef}
                globeImageUrl={undefined}
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                showAtmosphere={false}
                globeMaterial={emptyMaterial}
                animateIn={true}
                onGlobeReady={handleGlobeReady}
                onZoom={handleZoom}

                // ── Routes (Custom Corridors Layer with SLERP) ──
                customLayerData={memoArcs}
                customThreeObject={(datum: object) => {
                    const d = datum as ArcDatum;
                    const start = getCoords(d.startLat, d.startLng);
                    const end = getCoords(d.endLat, d.endLng);

                    const midAltitude = 0.015;
                    const midR = 100 * (1 + midAltitude);

                    // Spherical Linear Interpolation (slerp) for geometrically accurate midpoints across global coordinates
                    const qStart = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), start.clone().normalize());
                    const qEnd = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().normalize());
                    const qMid = qStart.clone().slerp(qEnd, 0.5);
                    const peak = new THREE.Vector3(0, 1, 0).applyQuaternion(qMid).multiplyScalar(midR);

                    // Quadratic Bezier Control Point to exactly hit the peak altitude mid-way
                    const control = peak.clone().multiplyScalar(2)
                        .sub(start.clone().multiplyScalar(0.5))
                        .sub(end.clone().multiplyScalar(0.5));

                    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
                    const dist = start.distanceTo(end);
                    const points = curve.getPoints(Math.max(20, Math.floor(dist * 2))); // Smooth curves based on distance
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    const material = d.isSolid
                        ? new THREE.LineBasicMaterial({
                            color: new THREE.Color(d.color),
                            transparent: true,
                            depthTest: true,
                            opacity: d.color === PALETTE.OVERLAND ? 1.0 : 0.8,
                        })
                        : new THREE.LineDashedMaterial({
                            color: new THREE.Color(d.color),
                            transparent: true,
                            depthTest: true,
                            opacity: 0.8,
                            dashSize: 2.0,
                            gapSize: 1.5,
                        });

                    const line = new THREE.Line(geometry, material);
                    line.computeLineDistances();
                    return line;
                }}

                polygonsData={countries}
                polygonCapMaterial={paperMaterial}
                polygonSideColor={() => 'rgba(0,0,0,0)'}
                polygonStrokeColor={() => '#A3A3A3'}
                polygonAltitude={0.005}

                // ── Ghost Layers (Native WebGL Text) ──
                labelsData={ghostLabels}
                labelLat="lat"
                labelLng="lng"
                labelText="label"
                labelSize={2.5}
                labelDotRadius={0}
                labelColor={() => 'rgba(17, 24, 39, 0.08)'}
                labelResolution={2}
                labelAltitude={0.01}

                // ── HTML Overlays (Tags + Anchors) ──
                htmlElementsData={d3Labels}
                htmlLat="lat"
                htmlLng="lng"
                htmlAltitude={() => 0.05}
                htmlElement={(d: HtmlElementDatum) => {
                    const container = document.createElement('div');

                    // A11y Container Node Format
                    container.className = 'pointer-events-auto cursor-pointer relative';
                    container.setAttribute('role', 'button');
                    container.tabIndex = 0;
                    container.setAttribute('aria-label', d.label);

                    const handleClick = (e: Event) => {
                        e.stopPropagation();
                        // Closure trap mitigation using stateRef
                        const _ = stateRef.current;
                        setSelectedNode(d);
                    };

                    container.addEventListener('click', handleClick);
                    container.addEventListener('keydown', (e: KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick(e as Event);
                        }
                    });

                    const inner = document.createElement('div');
                    inner.className = 'flex flex-col items-center origin-center transition-transform duration-150 ease-out';

                    const tag = document.createElement('div');
                    tag.innerHTML = d.label;
                    tag.className = 'text-[#111827] text-[12px] font-mono font-bold tracking-[0.05em] bg-transparent border-none whitespace-nowrap uppercase';
                    tag.style.webkitTextStroke = '0.5px #FFFFFF';
                    tag.style.textShadow = '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0px 2px 0 #fff, 0px -2px 0 #fff, 2px 0px 0 #fff, -2px 0px 0 #fff';

                    const coordsEl = document.createElement('div');
                    coordsEl.innerHTML = d.coord || '';
                    coordsEl.className = 'text-gray-500 text-[9px] font-normal font-mono pt-[1px]';
                    coordsEl.style.webkitTextStroke = '0.5px #FFFFFF';
                    coordsEl.style.textShadow = '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff';

                    inner.appendChild(tag);
                    inner.appendChild(coordsEl);

                    // Add physical grounding dot at the true lat/lng (since D3 force moved the label)
                    const anchor = document.createElement('div');
                    anchor.className = 'absolute -left-[2px] -top-[2px] w-[4px] h-[4px] bg-[#111827] rounded-full shadow-[0_0_0_1px_#fff] origin-center transition-transform duration-150 ease-out animate-[map-pulse_2s_infinite_ease-out]';
                    anchor.style.animationDelay = `${Math.random() * 2}s`;

                    const dx = d.d3x !== undefined ? d.d3x - d.lng! : 0;
                    const dy = d.d3y !== undefined ? d.d3y - d.lat! : 0; // Note: screen Y is inverted vs Lat

                    // Calculate translation spherical mapping for responsive dynamic scale taking into account retina display bounds
                    const xOffsetBase = dx * 15 * dppx;
                    const yOffsetBase = dy * -15 * dppx;

                    // Apply Translate FIRST using CSS variable projection multiplier, then static element Scale
                    inner.style.transform = `translate(calc(${xOffsetBase}px * var(--globe-offset-scale, 1)), calc(${yOffsetBase}px * var(--globe-offset-scale, 1))) scale(var(--globe-label-scale, 1))`;
                    anchor.style.transform = 'scale(var(--globe-dot-scale, 0.5))';

                    container.appendChild(anchor);
                    container.appendChild(inner);

                    return container;
                }}
            />

            {/* ── Route Legend ── */}
            <div className="absolute bottom-8 right-8 z-20 pointer-events-auto border border-gray-300 bg-white p-6" style={{ borderRadius: 0 }}>
                <h3 className="text-gray-900 text-[10px] tracking-[0.2em] font-mono uppercase mb-4">Cartographic Lexicon</h3>

                {[
                    { color: PALETTE.MARITIME, label: 'MARITIME ROUTES', desc: '(e.g., India to UAE)', isSolid: false },
                    { color: PALETTE.OVERLAND, label: 'OVERLAND / RAIL', desc: '(e.g., UAE to Israel)', isSolid: true },
                    { color: PALETTE.RIVAL, label: 'RIVAL CORRIDORS', desc: '(BRI / Development Road)', isSolid: true },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 mb-3 last:mb-0">
                        <div className="w-8 flex justify-between items-center shrink-0 opacity-80">
                            {item.isSolid ? (
                                <div className="h-[1.5px] w-full" style={{ background: item.color }} />
                            ) : (
                                <>
                                    <div className="h-[1.5px] w-[30%]" style={{ background: item.color }} />
                                    <div className="h-[1.5px] w-[30%]" style={{ background: item.color }} />
                                    <div className="h-[1.5px] w-[30%]" style={{ background: item.color }} />
                                </>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] text-gray-900 font-mono uppercase tracking-widest">{item.label}</span>
                            <span className="text-[9px] text-gray-900/50 font-serif" style={{ letterSpacing: '-0.02em' }}>{item.desc}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── DOSSIER PANEL (Right) ── */}
            {selectedNode && (
                <div ref={panelRef} onKeyDown={handlePanelKeyDown} className="absolute right-0 top-0 w-full md:w-[400px] lg:w-[450px] h-screen bg-gray-50 md:border-l border-gray-400 z-40 overflow-y-auto pointer-events-auto shadow-2xl"
                    style={{ borderRadius: 0 }}>

                    <div className="px-8 pt-24 pb-8">
                        {/* Close */}
                        <button ref={closeBtnRef} onClick={() => setSelectedNode(null)}
                            className="absolute top-20 right-6 text-gray-900/30 hover:text-gray-900 transition-colors cursor-pointer">
                            <X className="w-5 h-5" strokeWidth={1} />
                        </button>

                        {/* Type Badge */}
                        <div className="inline-flex items-center gap-2 border border-gray-400 px-3 py-1 mb-4 bg-gray-50"
                            style={{ borderRadius: 0 }}>
                            <span className="text-[10px] font-black font-mono text-gray-900">
                                +
                            </span>
                            <span className="text-[10px] tracking-[0.3em] uppercase font-mono text-gray-900">
                                {selectedNode.type || 'NODE'}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-2 font-serif uppercase tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            {selectedNode.label.replace(/-/g, ' ')}
                        </h2>
                        {selectedNode.coord && (
                            <div className="text-[10px] text-gray-900/50 font-mono tracking-widest mb-6">
                                {selectedNode.coord}
                            </div>
                        )}
                        {!selectedNode.coord && <div className="mb-6" />}

                        {/* Divider */}
                        <div className="w-full h-px bg-white/20 mb-6" />

                        {/* Desc */}
                        <div className="mb-8">
                            <div className="text-[9px] tracking-[0.3em] text-gray-900/30 uppercase mb-2 font-mono">
                                Intelligence Brief
                            </div>
                            <p className="text-[14px] text-gray-900/70 leading-relaxed font-serif">
                                {selectedNode.desc || "Verified geospatial transit anchor within the defined corridor matrices."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
