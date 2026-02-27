'use client';

import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, QuadraticBezierLine, Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useDefenseMode } from '@/components/DefenseContext';

/* ══════════════════════════════════════════════════════════
   COORDINATE SYSTEM
   ══════════════════════════════════════════════════════════ */

const R = 2;

function getPos(lat: number, lon: number, radius: number = R): [number, number, number] {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return [
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    ];
}

/* ══════════════════════════════════════════════════════════
   CORRIDOR DATA
   ══════════════════════════════════════════════════════════ */

const coords: Record<string, [number, number]> = {
    // IMEC Nodes
    mumbai: [18.94, 72.83],
    mundra: [22.74, 69.72],
    jebelAli: [25.01, 55.06],
    fujairah: [25.13, 56.34],
    riyadh: [24.71, 46.67],
    jordan: [29.53, 35.0],
    haifa: [32.81, 34.99],
    piraeus: [37.94, 23.64],
    marseille: [43.3, 5.37],
    // Blue-Raman
    oman: [23.58, 58.38],
    jeddah: [21.49, 39.19],
    aqaba: [29.53, 35.0],
    catania: [37.5, 15.09],
    genoa: [44.41, 8.93],
    // DRP
    alFaw: [29.97, 48.47],
    baghdad: [33.31, 44.37],
    mosul: [36.34, 43.14],
    ovakoy: [37.1, 42.4],
    mersin: [36.8, 34.63],
    // INSTC
    chabahar: [25.29, 60.64],
    tehran: [35.69, 51.42],
    baku: [40.41, 49.87],
    astrakhan: [46.35, 48.04],
    moscow: [55.76, 37.62],
    // Chokepoints
    babElMandeb: [12.58, 43.33],
    suezCanal: [30.46, 32.35],
};

type RouteSegment = {
    start: [number, number];
    end: [number, number];
    midOffset?: number;
};

type Corridor = {
    name: string;
    color: string;
    segments: RouteSegment[];
    dashed?: boolean;
    pulse?: boolean;
    lineWidth?: number;
};

const CORRIDORS: Corridor[] = [
    {
        name: 'IMEC Maritime',
        color: '#22d3ee', // cyan-400
        segments: [
            { start: coords.mundra, end: coords.jebelAli, midOffset: 0.18 },
            { start: coords.haifa, end: coords.piraeus, midOffset: 0.15 },
            { start: coords.piraeus, end: coords.marseille, midOffset: 0.12 },
        ],
        dashed: true,
        pulse: true,
        lineWidth: 2.2,
    },
    {
        name: 'IMEC Land',
        color: '#06b6d4', // cyan-500
        segments: [
            { start: coords.jebelAli, end: coords.riyadh, midOffset: 0.06 },
            { start: coords.riyadh, end: coords.jordan, midOffset: 0.06 },
            { start: coords.jordan, end: coords.haifa, midOffset: 0.04 },
        ],
        dashed: true,
        lineWidth: 1.8,
    },
    {
        name: 'Blue-Raman Cable',
        color: '#a855f7', // purple-500
        segments: [
            { start: coords.mumbai, end: coords.oman, midOffset: 0.03 },
            { start: coords.oman, end: coords.jeddah, midOffset: 0.03 },
            { start: coords.jeddah, end: coords.aqaba, midOffset: 0.03 },
            { start: coords.aqaba, end: coords.haifa, midOffset: 0.02 },
            { start: coords.haifa, end: coords.genoa, midOffset: 0.04 },
        ],
        lineWidth: 1.2,
    },
    {
        name: 'Development Road Project',
        color: '#f59e0b', // amber-500
        segments: [
            { start: coords.alFaw, end: coords.baghdad, midOffset: 0.06 },
            { start: coords.baghdad, end: coords.mosul, midOffset: 0.05 },
            { start: coords.mosul, end: coords.ovakoy, midOffset: 0.04 },
            { start: coords.ovakoy, end: coords.mersin, midOffset: 0.05 },
        ],
        dashed: true,
        pulse: true,
        lineWidth: 1.8,
    },
    {
        name: 'INSTC',
        color: '#ef4444', // red-500
        segments: [
            { start: coords.mumbai, end: coords.chabahar, midOffset: 0.12 },
            { start: coords.chabahar, end: coords.tehran, midOffset: 0.06 },
            { start: coords.tehran, end: coords.baku, midOffset: 0.06 },
            { start: coords.baku, end: coords.astrakhan, midOffset: 0.05 },
            { start: coords.astrakhan, end: coords.moscow, midOffset: 0.08 },
        ],
        dashed: true,
        lineWidth: 1.2,
    },
];

/* ══════════════════════════════════════════════════════════
   CHOKEPOINT DATA
   ══════════════════════════════════════════════════════════ */

type Chokepoint = {
    name: string;
    pos: [number, number];
    detail: string;
};

const CHOKEPOINTS: Chokepoint[] = [
    {
        name: 'Bab el-Mandeb Strait',
        pos: coords.babElMandeb,
        detail: 'THREAT ALERT: Red Sea maritime disruptions. Houthi attacks forcing shipping rerouting. IMEC provides overland redundancy.',
    },
    {
        name: 'Suez Canal',
        pos: coords.suezCanal,
        detail: 'THREAT ALERT: Transit fees up 15%. 90% of Euro-Asia maritime trade passes through this chokepoint. Insurance premiums +300% since Oct 2023.',
    },
];

/* ══════════════════════════════════════════════════════════
   GLOWING ARC
   ══════════════════════════════════════════════════════════ */

function GlowingArc({
    start,
    end,
    midPointOffset = 0.3,
    color,
    dashed = false,
    pulse = false,
    lineWidth = 2,
}: {
    start: [number, number];
    end: [number, number];
    midPointOffset?: number;
    color: string;
    dashed?: boolean;
    pulse?: boolean;
    lineWidth?: number;
}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineRef = useRef<any>(null);
    const cometRef = useRef<THREE.Mesh>(null);

    const { vStart, vEnd, vMid, curve } = useMemo(() => {
        const vs = new THREE.Vector3(...getPos(start[0], start[1]));
        const ve = new THREE.Vector3(...getPos(end[0], end[1]));
        const vm = vs.clone().lerp(ve, 0.5).normalize().multiplyScalar(R + midPointOffset);
        const cur = new THREE.QuadraticBezierCurve3(vs, vm, ve);
        return { vStart: vs, vEnd: ve, vMid: vm, curve: cur };
    }, [start, end, midPointOffset]);

    const baseColor = useMemo(() => new THREE.Color(color).multiplyScalar(pulse ? 2.5 : 1.2), [color, pulse]);
    const cometColor = useMemo(() => new THREE.Color(color).multiplyScalar(4.0), [color]);

    useFrame(({ clock }) => {
        if (lineRef.current && dashed && lineRef.current.material) {
            lineRef.current.material.dashOffset = -clock.elapsedTime * 1.5;
        }
        if (pulse && cometRef.current) {
            const t = (clock.elapsedTime * 0.3) % 1;
            const pos = curve.getPoint(t);
            cometRef.current.position.copy(pos);
        }
    });

    return (
        <group>
            <QuadraticBezierLine
                ref={lineRef}
                start={vStart}
                end={vEnd}
                mid={vMid}
                color={baseColor}
                lineWidth={lineWidth}
                dashed={dashed}
                dashScale={dashed ? 40 : 0}
                transparent
                opacity={0.9}
            />
            {pulse && (
                <mesh ref={cometRef}>
                    <sphereGeometry args={[0.025, 12, 12]} />
                    <meshBasicMaterial color={cometColor} toneMapped={false} />
                </mesh>
            )}
        </group>
    );
}

/* ══════════════════════════════════════════════════════════
   NODE MARKER (with glow halo)
   ══════════════════════════════════════════════════════════ */

function NodeMarker({ lat, lon, color, size = 0.03 }: { lat: number; lon: number; color: string; size?: number }) {
    const pos = getPos(lat, lon);
    return (
        <group position={pos}>
            <mesh>
                <sphereGeometry args={[size, 12, 12]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh>
                <sphereGeometry args={[size * 3, 12, 12]} />
                <meshBasicMaterial color={color} transparent opacity={0.12} />
            </mesh>
        </group>
    );
}

/* ══════════════════════════════════════════════════════════
   CHOKEPOINT MARKER (pulsing red dot + hover card)
   ══════════════════════════════════════════════════════════ */

function ChokepointMarker({ chokepoint }: { chokepoint: Chokepoint }) {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null);
    const pos = getPos(chokepoint.pos[0], chokepoint.pos[1], R + 0.02);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.3;
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group position={pos}>
            {/* Inner pulsing dot */}
            <mesh
                ref={meshRef}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <sphereGeometry args={[0.04, 12, 12]} />
                <meshBasicMaterial color="#ef4444" />
            </mesh>
            {/* Outer glow ring */}
            <mesh>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.1} />
            </mesh>
            {/* Hover HTML card */}
            {hovered && (
                <Html
                    distanceFactor={6}
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="relative pl-6 pb-6">
                        <svg className="absolute left-0 bottom-0 w-8 h-8 pointer-events-none" viewBox="0 0 32 32">
                            <line x1="0" y1="32" x2="32" y2="0" stroke="rgba(239,68,68,0.8)" strokeWidth="1.5" strokeDasharray="2 2" />
                        </svg>
                        <div className="w-64 p-4 rounded-xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,1)]" />
                                <span className="text-[10px] font-mono text-red-400 tracking-wider uppercase">
                                    {chokepoint.name}
                                </span>
                            </div>
                            <p className="text-[13px] text-zinc-300 leading-relaxed tracking-tight">
                                {chokepoint.detail}
                            </p>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

/* ══════════════════════════════════════════════════════════
   ATMOSPHERE (Fresnel-based edge glow)
   ══════════════════════════════════════════════════════════ */

function Atmosphere() {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const uniforms = useMemo(() => ({
        glowColor: { value: new THREE.Color('#1e40af') },
        viewVector: { value: new THREE.Vector3(0, 0, 5) },
    }), []);

    useFrame(({ camera }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.viewVector.value = camera.position;
        }
    });

    return (
        <mesh>
            <sphereGeometry args={[R * 1.12, 64, 64]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={uniforms}
                vertexShader={`
                    varying float vIntensity;
                    uniform vec3 viewVector;
                    void main() {
                        vec3 vNormal = normalize(normalMatrix * normal);
                        vec3 vNormel = normalize(normalMatrix * viewVector);
                        vIntensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform vec3 glowColor;
                    varying float vIntensity;
                    void main() {
                        gl_FragColor = vec4(glowColor, vIntensity * 0.5);
                    }
                `}
                transparent
                side={THREE.BackSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}

/* ══════════════════════════════════════════════════════════
   REALISTIC EARTH
   ══════════════════════════════════════════════════════════ */

function Earth() {
    const globeRef = useRef<THREE.Group>(null);

    // Texture loading is disabled as a fallback. Using a basic standard material.
    /*
    const [earthMap, bumpMap, specMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        '/textures/earth_daymap.jpg',
        '/textures/earth_bump.jpg',
        '/textures/earth_specular.jpg',
        '/textures/earth_clouds.png',
    ]);
    */

    const cloudsRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (globeRef.current) {
            globeRef.current.rotation.y += 0.001;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += 0.0015;
        }
    });

    // Key IMEC nodes
    const keyNodes = [
        { pos: coords.mundra, color: '#22d3ee' },
        { pos: coords.jebelAli, color: '#22d3ee' },
        { pos: coords.riyadh, color: '#f59e0b' },
        { pos: coords.haifa, color: '#ef4444' },
        { pos: coords.piraeus, color: '#22d3ee' },
        { pos: coords.marseille, color: '#22d3ee' },
        { pos: coords.alFaw, color: '#f59e0b' },
        { pos: coords.chabahar, color: '#ef4444' },
        { pos: coords.moscow, color: '#ef4444' },
        { pos: coords.genoa, color: '#a855f7' },
    ];

    return (
        <>
            {/* Starfield */}
            <Stars radius={120} depth={60} count={3000} factor={3} saturation={0} fade speed={0.5} />

            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[8, 5, 8]} intensity={2} color="#e2e8f0" />
            <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#1e3a5f" />

            {/* Atmosphere glow */}
            <Atmosphere />

            <group ref={globeRef} rotation={[0.3, -0.4, 0.05]}>
                {/* Main Earth sphere */}
                <Sphere args={[R, 128, 128]}>
                    <meshStandardMaterial
                        color="#0f172a" // slate-900 
                        emissive="#020617" // slate-950
                        wireframe={true}
                        roughness={0.8}
                        metalness={0.2}
                    />
                </Sphere>

                {/* Cloud layer */}
                <Sphere args={[R * 1.005, 64, 64]} ref={cloudsRef}>
                    <meshStandardMaterial
                        color="#334155" // slate-700
                        transparent
                        opacity={0.1}
                        wireframe={true}
                    />
                </Sphere>

                {/* ── CORRIDOR ROUTES ── */}
                {CORRIDORS.map((corridor) =>
                    corridor.segments.map((seg, j) => (
                        <GlowingArc
                            key={`${corridor.name}-${j}`}
                            start={seg.start}
                            end={seg.end}
                            midPointOffset={seg.midOffset || 0.1}
                            color={corridor.color}
                            dashed={corridor.dashed}
                            pulse={corridor.pulse}
                            lineWidth={corridor.lineWidth}
                        />
                    ))
                )}

                {/* ── NODE MARKERS ── */}
                {keyNodes.map((node, i) => (
                    <NodeMarker key={i} lat={node.pos[0]} lon={node.pos[1]} color={node.color} />
                ))}

                {/* ── CHOKEPOINT MARKERS ── */}
                {CHOKEPOINTS.map((cp) => (
                    <ChokepointMarker key={cp.name} chokepoint={cp} />
                ))}
            </group>
        </>
    );
}
/* ══════════════════════════════════════════════════════════
   CAMERA CONTROLLER (Defense Mode)
   ══════════════════════════════════════════════════════════ */

function CameraController() {
    const { isDefenseMode, sceneData } = useDefenseMode();
    const { camera } = useThree();
    const targetRef = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        if (!isDefenseMode) return;

        // Smoothly interpolate camera position
        const targetPos = new THREE.Vector3(...sceneData.cameraPos);
        camera.position.lerp(targetPos, delta * 2.5);

        // Smoothly interpolate lookAt target
        const targetLook = new THREE.Vector3(...sceneData.cameraTarget);
        targetRef.current.lerp(targetLook, delta * 2.5);
        camera.lookAt(targetRef.current);
    });

    return null;
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════ */

export default function RealisticGlobe() {
    const { sceneData } = useDefenseMode();

    return (
        <div
            className={`w-full h-full min-h-screen relative transition-all duration-1000 ease-in-out ${sceneData.blurGlobe ? 'blur-md opacity-40' : 'blur-0 opacity-100'
                }`}
        >
            <Canvas
                camera={{ position: [0, 0.8, 4.5], fov: 42 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    <OrbitControls
                        enableZoom={true}
                        enablePan={true}
                        enableRotate={true}
                        autoRotate
                        autoRotateSpeed={0.15}
                        minDistance={3.0}
                        maxDistance={10}
                        zoomSpeed={0.8}
                    />
                    <CameraController />
                    <Earth />
                    <EffectComposer>
                        <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
                    </EffectComposer>
                </Suspense>
            </Canvas>

            {/* ── Route Legend (Only show when not blurred) ── */}
            {!sceneData.blurGlobe && (
                <div className="absolute bottom-6 left-6 z-20 space-y-1 pointer-events-none">
                    {[
                        { color: 'bg-cyan-400', label: 'IMEC Corridor', icon: '—' },
                        { color: 'bg-purple-500', label: 'Blue-Raman Cable', icon: '—' },
                        { color: 'bg-amber-500', label: 'Development Road (DRP)', icon: '- -' },
                        { color: 'bg-red-500', label: 'INSTC (Iran-Russia)', icon: '- -' },
                        { color: 'bg-red-500 animate-pulse', label: 'Threat Chokepoint', icon: '●' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2.5 py-1 rounded border border-white/[0.04] backdrop-blur-sm">
                            <span className={`w-1.5 h-1.5 rounded-full ${item.color} flex-shrink-0`} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
