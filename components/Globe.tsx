'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, QuadraticBezierLine, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ── Lat/Lon → 3D Cartesian ── */
function getPos(lat: number, lon: number, radius: number): [number, number, number] {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return [
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    ];
}

const R = 2;

/* ── Corridor Node Coordinates [Lat, Lon] ── */
const coords = {
    mumbai: [18.94, 72.83],
    mundra: [22.74, 69.72],
    jebelAli: [25.01, 55.06],
    fujairah: [25.13, 56.34],
    riyadh: [24.71, 46.67],
    haifa: [32.81, 34.99],
    piraeus: [37.94, 23.64],
    marseille: [43.3, 5.37],
    basra: [30.5, 47.78],
    turkishBorder: [37.14, 42.22],
    // Blue-Raman waypoints
    mumbaiSub: [15.0, 68.0],
    haifaSub: [31.5, 33.5],
    marseilleSub: [42.5, 4.8],
};

/* ── Node data for labels ── */
const NODES = [
    { name: 'Mumbai', pos: coords.mumbai, color: '#10b981' },
    { name: 'Jebel Ali', pos: coords.jebelAli, color: '#10b981' },
    { name: 'Riyadh', pos: coords.riyadh, color: '#f59e0b' },
    { name: 'Haifa', pos: coords.haifa, color: '#ef4444' },
    { name: 'Piraeus', pos: coords.piraeus, color: '#10b981' },
    { name: 'Marseille', pos: coords.marseille, color: '#10b981' },
    { name: 'Basra', pos: coords.basra, color: '#ef4444' },
];

/* ── Glowing Arc Component ── */
function GlowingArc({
    start,
    end,
    midPointOffset = 0.5,
    color,
    dashed = false,
    pulse = false,
    lineWidth = 2,
}: {
    start: number[];
    end: number[];
    midPointOffset?: number;
    color: string;
    dashed?: boolean;
    pulse?: boolean;
    lineWidth?: number;
}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineRef = useRef<any>(null);

    const vStart = new THREE.Vector3(...getPos(start[0], start[1], R));
    const vEnd = new THREE.Vector3(...getPos(end[0], end[1], R));
    const vMid = vStart.clone().lerp(vEnd, 0.5).normalize().multiplyScalar(R + midPointOffset);

    useFrame(({ clock }) => {
        if (lineRef.current && pulse && lineRef.current.material) {
            lineRef.current.material.dashOffset = -clock.elapsedTime * 2;
        }
    });

    return (
        <QuadraticBezierLine
            ref={lineRef}
            start={vStart}
            end={vEnd}
            mid={vMid}
            color={color}
            lineWidth={lineWidth}
            dashed={dashed}
            dashScale={dashed ? 50 : 0}
            transparent
            opacity={0.85}
        />
    );
}

/* ── Node Marker ── */
function NodeMarker({ lat, lon, color, size = 0.035 }: { lat: number; lon: number; color: string; size?: number }) {
    const pos = getPos(lat, lon, R);
    return (
        <group position={pos}>
            {/* Inner dot */}
            <mesh>
                <sphereGeometry args={[size, 16, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>
            {/* Outer glow */}
            <mesh>
                <sphereGeometry args={[size * 2.5, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} />
            </mesh>
        </group>
    );
}

/* ── Scene ── */
function Scene() {
    const globeRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (globeRef.current) {
            globeRef.current.rotation.y += 0.0015;
        }
    });

    return (
        <>
            <ambientLight intensity={0.15} />
            <directionalLight position={[5, 3, 5]} intensity={1.2} />
            <Stars radius={100} depth={50} count={4000} factor={3} saturation={0} fade speed={0.8} />

            <group ref={globeRef} rotation={[0.35, -0.5, 0]}>
                {/* Wireframe globe shell */}
                <Sphere args={[R, 64, 64]}>
                    <meshPhongMaterial color="#18181b" wireframe opacity={0.5} transparent />
                </Sphere>

                {/* Solid dark core */}
                <Sphere args={[R - 0.01, 32, 32]}>
                    <meshBasicMaterial color="#09090b" />
                </Sphere>

                {/* ── IMEC Route (Maritime + Rail) — Emerald/Blue ── */}
                <GlowingArc start={coords.mumbai} end={coords.jebelAli} color="#3b82f6" dashed pulse midPointOffset={0.2} />
                <GlowingArc start={coords.jebelAli} end={coords.riyadh} color="#10b981" dashed midPointOffset={0.08} lineWidth={1.5} />
                <GlowingArc start={coords.riyadh} end={coords.haifa} color="#10b981" dashed midPointOffset={0.08} lineWidth={1.5} />
                <GlowingArc start={coords.haifa} end={coords.piraeus} color="#3b82f6" dashed pulse midPointOffset={0.15} />
                <GlowingArc start={coords.piraeus} end={coords.marseille} color="#3b82f6" dashed pulse midPointOffset={0.12} />

                {/* ── Blue-Raman Submarine Cable — Purple ── */}
                <GlowingArc start={coords.mumbai} end={coords.haifa} color="#a855f7" midPointOffset={0.04} lineWidth={1.2} />
                <GlowingArc start={coords.haifa} end={coords.marseille} color="#a855f7" midPointOffset={0.04} lineWidth={1.2} />

                {/* ── Development Road Project — Red/Orange ── */}
                <GlowingArc start={coords.basra} end={coords.turkishBorder} color="#ef4444" midPointOffset={0.08} dashed pulse lineWidth={1.8} />

                {/* ── Node Markers ── */}
                {NODES.map((node) => (
                    <NodeMarker key={node.name} lat={node.pos[0]} lon={node.pos[1]} color={node.color} />
                ))}
            </group>
        </>
    );
}

/* ── Main Globe Export ── */
export default function Globe() {
    return (
        <div className="w-full h-full min-h-[400px] md:min-h-[550px] relative rounded-lg overflow-hidden border border-white/[0.06]">
            {/* Bottom fade gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 pointer-events-none" />

            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.4} />
                <Scene />
            </Canvas>

            {/* ── Route Legend ── */}
            <div className="absolute bottom-4 left-4 z-20 space-y-1.5 pointer-events-none">
                <LegendItem color="bg-emerald-500" label="IMEC Land Route" pulse />
                <LegendItem color="bg-blue-500" label="IMEC Maritime" />
                <LegendItem color="bg-purple-500" label="Blue-Raman Cable" />
                <LegendItem color="bg-red-500" label="Development Road (DRP)" pulse />
            </div>
        </div>
    );
}

/* ── Legend Item ── */
function LegendItem({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2.5 py-1 rounded border border-white/[0.06] backdrop-blur-sm">
            <div className={`w-1.5 h-1.5 rounded-full ${color} ${pulse ? 'animate-pulse-dot' : ''}`} />
            {label}
        </div>
    );
}
