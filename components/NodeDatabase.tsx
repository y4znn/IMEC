/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Anchor, Network, AlertTriangle, Lightbulb, Hexagon, SlidersHorizontal, Eye, Activity, Server, Zap, ShieldAlert, Swords, Sun, Moon, Clock } from 'lucide-react';
import * as d3 from 'd3-force-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

/* ══════════════════════════════════════════════════════════
   DATASET (Hardcoded IMEC + AI War Cloud Intelligence Data)
   ══════════════════════════════════════════════════════════ */

type NodeType = 'Actor' | 'Framework' | 'Logistics' | 'Digital' | 'Energy' | 'Shock' | 'Rival';

interface NodeData {
    id: string;
    label: string;
    type: NodeType;
    val: number;
    color: string;
    fz?: number;              // Z-Stack Layer mapping
    commencementDate?: number; // Timeline slider mapping
    ghost?: boolean;          // Requires decryption to fully appear
    decrypted?: boolean;
    x?: number;
    y?: number;
    z?: number;
    desc: string;
}

interface LinkData {
    source: string;
    target: string;
    label?: string;
    commencementDate?: number;
}

const gData: { nodes: NodeData[]; links: LinkData[] } = {
    nodes: [
        // CATEGORY: GEOPOLITICAL ACTORS & FRAMEWORKS (Middle Layer: z=0)
        { id: "usa", type: "Actor", val: 6, color: "#e4e4e7", fz: 0, commencementDate: 2020, label: "United States", desc: "Strategic backer of IMEC via PGII to counter China's BRI." },
        { id: "india", type: "Actor", val: 6, color: "#e4e4e7", fz: 0, commencementDate: 2020, label: "India", desc: "Anchor economy leveraging IMEC to bypass Pakistan." },
        { id: "eu", type: "Actor", val: 5, color: "#e4e4e7", fz: 0, commencementDate: 2021, label: "European Union", desc: "Aligning IMEC with its €300 Billion Global Gateway fund." },
        { id: "ksa", type: "Actor", val: 5, color: "#e4e4e7", fz: 0, commencementDate: 2020, label: "Saudi Arabia", desc: "Crucial land bridge connecting the Gulf to the Levant." },
        { id: "uae", type: "Actor", val: 5, color: "#e4e4e7", fz: 0, commencementDate: 2020, label: "UAE", desc: "Pioneering the logistics network and funding Jordanian rails." },
        { id: "israel", type: "Actor", val: 4, color: "#e4e4e7", fz: 0, commencementDate: 2020, label: "Israel", desc: "The Mediterranean anchor point; provides overland redundancy." },
        { id: "china", type: "Actor", val: 6, color: "#e4e4e7", fz: 0, commencementDate: 2020, label: "China", desc: "Architect of the $8 Trillion BRI. Views IMEC as containment." },

        { id: "abraham_accords", type: "Framework", val: 4, color: "#e4e4e7", fz: 0, commencementDate: 2020, label: "Abraham Accords", desc: "Geopolitical normalization underpinning the overland routes." },
        { id: "pgii", type: "Framework", val: 3, color: "#e4e4e7", fz: 0, commencementDate: 2022, label: "G7 PGII", desc: "Partnership for Global Infrastructure and Investment." },
        { id: "global_gateway", type: "Framework", val: 3, color: "#e4e4e7", fz: 0, commencementDate: 2021, label: "EU Global Gateway", desc: "EU strategy to mobilize investments." },
        { id: "i2u2", type: "Framework", val: 3, color: "#e4e4e7", fz: 0, commencementDate: 2021, label: "I2U2 Group", desc: "India, Israel, UAE, and US partnership." },
        { id: "imec_announce", type: "Framework", val: 5, color: "#38bdf8", fz: 0, commencementDate: 2023.09, label: "IMEC Declaration", desc: "Formal announcement at G20 New Delhi." },

        // -- AI WAR CLOUD INTEGRATIONS (Actors & Frameworks) --
        { id: "palantir", type: "Actor", val: 5, color: "#e4e4e7", fz: 0, commencementDate: 2021, label: "Palantir Foundry", desc: "Military/intelligence data integration platform." },
        { id: "scaleai", type: "Actor", val: 4, color: "#e4e4e7", fz: 0, commencementDate: 2022, label: "ScaleAI", desc: "Data labeling for autonomous defense systems." },
        { id: "elbit", type: "Actor", val: 4, color: "#e4e4e7", fz: 0, commencementDate: 2020, label: "Elbit Systems", desc: "Defense contractor providing physical security infrastructure." },
        { id: "ai_dss", type: "Framework", val: 4, color: "#a855f7", fz: 0, commencementDate: 2023, label: "AI-DSS Protocol", desc: "Automated Decision Support Systems integrating global sensor nodes." },

        // CATEGORY: TRANSPORTATION PILLAR - PORTS & RAIL (Bottom Layer: z=-50)
        { id: "vadhavan", type: "Logistics", val: 4, color: "#3b82f6", fz: -50, commencementDate: 2024, label: "Vadhavan Port", desc: "Upcoming $9B Indian mega-port." },
        { id: "jebel_ali", type: "Logistics", val: 4, color: "#3b82f6", fz: -50, commencementDate: 2020, label: "Jebel Ali Port", desc: "The largest port in the Middle East." },
        { id: "al_ghuwaifat", type: "Logistics", val: 2, color: "#3b82f6", fz: -50, commencementDate: 2021, label: "Al-Ghuwaifat Link", desc: "Crucial UAE-Saudi Arabia rail border crossing." },
        { id: "al_haditha", type: "Logistics", val: 2, color: "#3b82f6", fz: -50, commencementDate: 2021, label: "Al-Haditha Hub", desc: "Key Saudi-Jordanian border transshipment." },
        { id: "mafraq", type: "Logistics", val: 3, color: "#3b82f6", fz: -50, commencementDate: 2023, label: "Mafraq (JOR)", desc: "Jordanian logistical hub." },
        { id: "beit_shean", type: "Logistics", val: 3, color: "#3b82f6", fz: -50, commencementDate: 2023, label: "Beit She'an (ISR)", desc: "Vital rail junction connecting Jordan to Israel." },
        { id: "haifa", type: "Logistics", val: 5, color: "#3b82f6", fz: -50, commencementDate: 2020, label: "Haifa Port", desc: "Critical Mediterranean gateway, acquired by Adani." },
        { id: "piraeus", type: "Logistics", val: 4, color: "#3b82f6", fz: -50, commencementDate: 2020, label: "Piraeus Port", desc: "Major European entry point, controlled by COSCO." },
        { id: "marseille", type: "Logistics", val: 3, color: "#3b82f6", fz: -50, commencementDate: 2020, label: "Port of Marseille", desc: "Key European terminus for shipping and cables." },

        // Ghost Nodes
        { id: "ben_gurion_canal", type: "Logistics", val: 4, color: "#3b82f6", fz: -50, commencementDate: 2025, ghost: true, label: "Ben Gurion Canal [SPECULATIVE]", desc: "Theoretical Israeli alternative to the Suez Canal." },

        // CATEGORY: DIGITAL PILLAR - DATA SOVEREIGNTY (Top Layer: z=50)
        { id: "blue_raman", type: "Digital", val: 5, color: "#a855f7", fz: 50, commencementDate: 2023, label: "Blue-Raman Cable", desc: "218 Tbps Google subsea fiber bypassing Egypt." },
        { id: "teas", type: "Digital", val: 4, color: "#a855f7", fz: 50, commencementDate: 2023, label: "TEAS Network", desc: "Trans Europe Asia System linking Mumbai to Marseille." },
        { id: "data_centers", type: "Digital", val: 4, color: "#a855f7", fz: 50, commencementDate: 2024, label: "Gulf AI Data Centers", desc: "High-compute nodes in UAE/KSA drawing on IMEC." },

        // -- AI WAR CLOUD INTEGRATIONS (Digital) --
        { id: "project_nimbus", type: "Digital", val: 5, color: "#a855f7", fz: 50, commencementDate: 2021, label: "Project Nimbus", desc: "$1.2B cloud computing project by Google/Amazon." },
        { id: "lavender", type: "Digital", val: 4, color: "#a855f7", fz: 50, commencementDate: 2023.10, label: "Lavender AI", desc: "Automated targeting system deployed in asymmetric conflict." },
        { id: "peace_cable", type: "Digital", val: 4, color: "#a855f7", fz: 50, commencementDate: 2024, ghost: true, label: "PEACE Cable [CLASSIFIED]", desc: "Chinese-backed digital backbone penetrating the Mediterranean." },

        // CATEGORY: ENERGY PILLAR (Middle Layer: z=0)
        { id: "neom_h2", type: "Energy", val: 4, color: "#10b981", fz: 0, commencementDate: 2022, label: "NEOM Green Hydrogen", desc: "$8.4B Saudi project aimed at exporting green ammonia." },
        { id: "hvdc_interconnector", type: "Energy", val: 4, color: "#10b981", fz: 0, commencementDate: 2024, label: "UAE-India HVDC", desc: "Proposed High-Voltage Direct Current subsea cable." },

        // CATEGORY: THREATS, SHOCKS & CHOKEPOINTS (Float dynamically relative to impact)
        { id: "gaza_war", type: "Shock", val: 6, color: "#ef4444", fz: 0, commencementDate: 2023.10, label: "Gaza War", desc: "Systemic shock stalling normalization." },
        { id: "red_sea", type: "Shock", val: 5, color: "#ef4444", fz: -50, commencementDate: 2023.11, label: "Red Sea Crisis", desc: "Houthi attacks paralyzing Suez shipping." },
        { id: "suez_chokepoint", type: "Shock", val: 4, color: "#ef4444", fz: -50, commencementDate: 2020, label: "Suez Vulnerability", desc: "Historical maritime bottleneck." },
        { id: "automated_targeting", type: "Shock", val: 4, color: "#ef4444", fz: 50, commencementDate: 2024, label: "AI Target Bleed", desc: "Algorithms executing lethal targeting without human loops." },

        // CATEGORY: RIVAL ARCHITECTURES
        { id: "bri", type: "Rival", val: 5, color: "#f59e0b", fz: 0, commencementDate: 2020, label: "Belt & Road Initiative", desc: "China's global infrastructure project." },
        { id: "drp", type: "Rival", val: 4, color: "#f59e0b", fz: -50, commencementDate: 2023, label: "Development Road", desc: "$17 Billion Iraq-Turkey rail bypass." },
    ],
    links: [
        // Foundations
        { source: "israel", target: "abraham_accords", commencementDate: 2020 }, { source: "uae", target: "abraham_accords", commencementDate: 2020 },
        { source: "abraham_accords", target: "i2u2", commencementDate: 2021 }, { source: "india", target: "i2u2", commencementDate: 2021 },
        { source: "i2u2", target: "imec_announce", commencementDate: 2023.09 }, { source: "eu", target: "imec_announce", commencementDate: 2023.09 },

        // Vertical Integrations (Nodes connecting across Z-planes)
        { source: "haifa", target: "blue_raman", commencementDate: 2023 }, // Physical -> Digital
        { source: "jebel_ali", target: "data_centers", commencementDate: 2024 }, // Physical -> Digital
        { source: "ksa", target: "neom_h2", commencementDate: 2022 }, // Actor -> Energy

        // Horizontal Physical Logistics
        { source: "vadhavan", target: "jebel_ali", commencementDate: 2024 },
        { source: "jebel_ali", target: "al_ghuwaifat", commencementDate: 2021 },
        { source: "al_ghuwaifat", target: "al_haditha", commencementDate: 2021 },
        { source: "al_haditha", target: "mafraq", commencementDate: 2023 },
        { source: "mafraq", target: "beit_shean", commencementDate: 2023 },
        { source: "beit_shean", target: "haifa", commencementDate: 2023 },
        { source: "haifa", target: "piraeus", commencementDate: 2020 },
        { source: "piraeus", target: "marseille", commencementDate: 2020 },

        // AI War Cloud Network (Cross-layer cyber warfare)
        { source: "usa", target: "palantir", commencementDate: 2021 },
        { source: "israel", target: "elbit", commencementDate: 2020 },
        { source: "palantir", target: "ai_dss", commencementDate: 2023 },
        { source: "scaleai", target: "ai_dss", commencementDate: 2023 },
        { source: "ai_dss", target: "lavender", commencementDate: 2023.10 },
        { source: "usa", target: "project_nimbus", commencementDate: 2021 },
        { source: "project_nimbus", target: "israel", commencementDate: 2021 },
        { source: "project_nimbus", target: "lavender", commencementDate: 2023.10 },
        { source: "lavender", target: "automated_targeting", commencementDate: 2024 },
        { source: "project_nimbus", target: "data_centers", commencementDate: 2024 },

        // Shocks
        { source: "gaza_war", target: "abraham_accords", commencementDate: 2023.10 }, // Disrupts framework
        { source: "gaza_war", target: "red_sea", commencementDate: 2023.11 },
        { source: "red_sea", target: "suez_chokepoint", commencementDate: 2023.11 },

        // Rivals & Ghosts
        { source: "china", target: "bri", commencementDate: 2020 },
        { source: "china", target: "peace_cable", commencementDate: 2024 },
        { source: "bri", target: "drp", commencementDate: 2023 },
        { source: "suez_chokepoint", target: "ben_gurion_canal", commencementDate: 2025 }
    ]
};

export default function NodeDatabase() {
    const fgRef = useRef<any>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);

    // Decryption state for ghost nodes
    const [decryptedNodes, setDecryptedNodes] = useState<Set<string>>(new Set());
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // AI Analyst Panel
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [timelineYear, setTimelineYear] = useState<number>(2026);
    const [searchQuery, setSearchQuery] = useState('');

    // Physics Engine Controls
    const [linkDistance, setLinkDistance] = useState(80);
    const [repulsion, setRepulsion] = useState(-400);

    // On hover decryption logic for ghost nodes
    const handleNodeHover = useCallback((node: NodeData | null) => {
        setHoveredNode(node);

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        if (node && node.ghost && !decryptedNodes.has(node.id)) {
            // Apply decryption delay
            hoverTimeoutRef.current = setTimeout(() => {
                setDecryptedNodes(prev => new Set(prev).add(node.id));
            }, 3000);
        }
    }, [decryptedNodes]);

    const handleNodeClick = useCallback((node: NodeData) => {
        if (node.ghost && !decryptedNodes.has(node.id)) return; // Prevents clicking encrypted nodes
        setSelectedNode(node);
        setIsPanelOpen(true);

        // Center camera smoothly in 3D
        if (fgRef.current) {
            const distance = 150;
            const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
            fgRef.current.cameraPosition(
                { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio + 100 },
                node,
                1500
            );
        }
    }, [decryptedNodes, fgRef]);

    // Apply Timeline Filter
    const filteredData = useMemo(() => {
        const activeNodes = gData.nodes.map(n => ({
            ...n,
            decrypted: decryptedNodes.has(n.id)
        })).filter(n => (n.commencementDate || 2020) <= timelineYear)
            .filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.type.toLowerCase().includes(searchQuery.toLowerCase()));

        const nodeIds = new Set(activeNodes.map(n => n.id));
        const activeLinks = gData.links.filter(l =>
            nodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source) &&
            nodeIds.has(typeof l.target === 'object' ? (l.target as any).id : l.target) &&
            (l.commencementDate || 2020) <= timelineYear
        );

        return { nodes: activeNodes, links: activeLinks };
    }, [timelineYear, decryptedNodes, searchQuery]);

    useEffect(() => {
        if (fgRef.current) {
            const fg = fgRef.current;
            fg.d3Force('link').distance(linkDistance);
            fg.d3Force('charge').strength(repulsion);
            // Lock nodes to their assigned Z planes
            fg.d3Force('z', d3.forceZ().z((d: any) => d.fz !== undefined ? d.fz : 0).strength(1));
            // 3D collision using d3-force-3d internal mappings
            fg.d3Force('collide', d3.forceCollide().radius((node: any) => Math.sqrt(node.val || 1) * 3 + 6 + (node.val > 4 ? 15 : 0)));
            fg.d3ReheatSimulation();

            // Add Environmental Z-Stack Grids
            const scene = fg.scene();
            if (scene && !scene.getObjectByName('z-stack-grids')) {
                const gridGroup = new THREE.Group();
                gridGroup.name = 'z-stack-grids';

                const createGrid = (z: number) => {
                    const grid = new THREE.GridHelper(600, 40, 0xffffff, 0xffffff);
                    grid.position.z = z;
                    grid.rotation.x = Math.PI / 2; // Orient grid to XY horizontal plane
                    (grid.material as THREE.Material).opacity = 0.05;
                    (grid.material as THREE.Material).transparent = true;
                    return grid;
                };

                gridGroup.add(createGrid(50));
                gridGroup.add(createGrid(0));
                gridGroup.add(createGrid(-50));
                scene.add(gridGroup);
            }
        }
    }, [linkDistance, repulsion, filteredData]);

    return (
        <div className="absolute inset-0 z-10 w-full h-screen overflow-hidden font-sans bg-black">

            {/* ── Search Bar Overlay ── */}
            <div className="absolute top-24 left-6 z-20 pointer-events-auto">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl transition-all group hover:bg-zinc-900/60 focus-within:bg-zinc-900/60 focus-within:border-white/20">
                    <Search className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-colors" strokeWidth={1.2} />
                    <input
                        type="text"
                        placeholder="Search node telemetry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-56 font-mono tracking-tight"
                    />
                </div>
            </div>

            {/* ── 3D Force Graph ── */}
            <div className="absolute inset-0 cursor-crosshair">
                <ForceGraph3D
                    ref={fgRef}
                    graphData={filteredData}
                    nodeRelSize={4}
                    backgroundColor="#000000"
                    showNavInfo={false}
                    onNodeHover={(n) => handleNodeHover(n as NodeData)}
                    onNodeClick={(n) => handleNodeClick(n as NodeData)}

                    // 3D Node Rendering
                    nodeThreeObject={(node: any) => {
                        const isGhost = node.ghost && !node.decrypted;
                        const isHovered = node === hoveredNode;

                        const group = new THREE.Group();

                        // Sphere Core
                        const r = Math.sqrt(node.val) * 2;
                        const geometry = new THREE.SphereGeometry(r, 16, 16);
                        const material = new THREE.MeshStandardMaterial({
                            color: node.color,
                            transparent: true,
                            opacity: isGhost ? 0.15 : (isHovered ? 1.0 : 0.8),
                            emissive: node.color,
                            emissiveIntensity: isHovered ? 2.5 : 1.2,
                            wireframe: isGhost // Gives it a skeletal look
                        });
                        const sphere = new THREE.Mesh(geometry, material);
                        group.add(sphere);

                        // Rotating Ring for Parent Nodes (val >= 5)
                        if (node.val >= 5 && !isGhost) {
                            const torusGeo = new THREE.TorusGeometry(r + 1.5, 0.2, 16, 32);
                            const torusMat = new THREE.MeshStandardMaterial({
                                color: node.color,
                                transparent: true,
                                opacity: 0.5,
                                emissive: node.color,
                                emissiveIntensity: 2.0
                            });
                            const torus = new THREE.Mesh(torusGeo, torusMat);
                            // Set static rotation angles or optionally animate via ref
                            torus.rotation.x = Math.PI / 2;
                            group.add(torus);
                        }

                        // Text Label (Always faces camera)
                        if (!isGhost || isHovered) {
                            const label = isGhost ? "DECRYPTING..." : node.label;
                            const sprite = new SpriteText(label);
                            sprite.color = isGhost ? '#ef4444' : '#ffffff';
                            sprite.textHeight = isHovered ? 4 : 3;
                            sprite.position.y = r + 3;
                            group.add(sprite);
                        }

                        return group;
                    }}

                    // Custom Link Drawing
                    linkCurvature={0.2}
                    linkCurveRotation={0.5}
                    linkDirectionalParticles={(l: any) => {
                        const sourceZ = typeof l.source === 'object' ? (l.source.fz || 0) : 0;
                        const targetZ = typeof l.target === 'object' ? (l.target.fz || 0) : 0;
                        const sourceType = typeof l.source === 'object' ? l.source.type : '';
                        const targetType = typeof l.target === 'object' ? l.target.type : '';

                        if (sourceType === 'Shock' || targetType === 'Shock') return 6;
                        if (sourceZ !== targetZ) return 4;
                        return (l.commencementDate && l.commencementDate === timelineYear) ? 4 : 1;
                    }}
                    linkDirectionalParticleWidth={1.5}
                    linkDirectionalParticleColor={(l: any) => {
                        const sourceType = typeof l.source === 'object' ? l.source.type : '';
                        const targetType = typeof l.target === 'object' ? l.target.type : '';
                        if (sourceType === 'Shock' || targetType === 'Shock') return 'rgba(239, 68, 68, 0.8)';
                        return 'rgba(255, 255, 255, 0.8)';
                    }}
                    linkWidth={(l: any) => {
                        const sourceZ = typeof l.source === 'object' ? (l.source.fz || 0) : 0;
                        const targetZ = typeof l.target === 'object' ? (l.target.fz || 0) : 0;
                        return sourceZ !== targetZ ? 1.5 : 0.5; // Thicker vertical links
                    }}
                    linkColor={(l: any) => {
                        const sourceZ = typeof l.source === 'object' ? (l.source.fz || 0) : 0;
                        const targetZ = typeof l.target === 'object' ? (l.target.fz || 0) : 0;
                        const sourceType = typeof l.source === 'object' ? l.source.type : '';
                        const targetType = typeof l.target === 'object' ? l.target.type : '';

                        // Glowing white for vertical cross-layer dependencies
                        if (sourceZ !== targetZ) return 'rgba(255, 255, 255, 0.4)';
                        // Red indicator for shock links
                        if (sourceType === 'Shock' || targetType === 'Shock') return 'rgba(239, 68, 68, 0.5)';
                        return 'rgba(255, 255, 255, 0.15)';
                    }}
                />
            </div>

            {/* ── Overlay: The Time Machine Slider ── */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-[600px]">
                <div className="backdrop-blur-xl bg-zinc-900/60 border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-4">
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" strokeWidth={1.2} /> Temporal Intelligence
                        </span>
                        <span className={`font-mono text-sm font-bold ${timelineYear >= 2023.10 ? 'text-red-500' : 'text-zinc-200'}`}>
                            {timelineYear < 2023.10 ? Math.floor(timelineYear) : (timelineYear === 2023.10 ? 'OCT 2023: GAZA SHOCK' : '2024-2026: ESCALATION')}
                        </span>
                    </div>

                    <input
                        type="range"
                        min="2020"
                        max="2026"
                        step="0.05"
                        value={timelineYear}
                        onChange={(e) => setTimelineYear(parseFloat(e.target.value))}
                        className="w-full appearance-none bg-zinc-800 h-1 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                    />
                    <div className="flex justify-between w-full text-[10px] text-zinc-600 font-mono mt-2 px-1">
                        <span>2020</span>
                        <span>2022</span>
                        <span>2024</span>
                        <span>2026</span>
                    </div>

                    <div className="w-full flex items-center gap-4 mt-6 pt-4 border-t border-white/5 disabled:opacity-50">
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1 w-24">
                            <SlidersHorizontal className="w-3 h-3" strokeWidth={1.2} /> Repulsion
                        </span>
                        <input
                            type="range"
                            min="-1000"
                            max="-50"
                            step="10"
                            value={repulsion}
                            onChange={(e) => setRepulsion(parseFloat(e.target.value))}
                            className="flex-1 appearance-none bg-zinc-800 h-1 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-zinc-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:bg-white transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* ── AI Analyst Slide-out Panel ── */}
            <AnimatePresence>
                {isPanelOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        className="absolute top-24 right-6 w-96 max-h-[80vh] overflow-y-auto custom-scrollbar z-30 bg-zinc-900/60 backdrop-blur-[20px] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2 chromatic-text cursor-default">
                                    <Activity className="w-4 h-4 text-purple-400" strokeWidth={1.2} /> AI-DSS Report
                                </h3>
                                <button onClick={() => setIsPanelOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-4 h-4" strokeWidth={1.2} />
                                </button>
                            </div>

                            {selectedNode ? (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white tracking-tight leading-none mb-1">
                                            {selectedNode.label}
                                        </h2>
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-white/5 border border-white/10`} style={{ color: selectedNode.color }}>
                                            {selectedNode.type} Node
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                                        {selectedNode.desc}
                                    </p>

                                    <div className="pt-4 border-t border-white/10">
                                        <h4 className="text-[10px] font-mono uppercase text-zinc-500 mb-2">Automated Strategic Friction Briefing</h4>
                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-zinc-300 leading-relaxed">
                                            {selectedNode.type === 'Shock' ? (
                                                <span className="text-red-400">CRITICAL VULNERABILITY DETECTED. Network flow compromised. Immediate state-intervention required to stabilize logistical throughput.</span>
                                            ) : (
                                                <span>Analyzing structural dependencies... System nominal. {selectedNode.type === 'Digital' ? 'Cloud perimeter secure but facing AI intrusion spikes.' : 'Supply chain resilient against secondary shocks.'}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-2">
                                        <h4 className="text-[10px] font-mono text-zinc-500 mb-3 uppercase">Forensic Metadata</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                                <div className="text-[9px] text-zinc-500 font-mono mb-1">Z-PLANE</div>
                                                <div className="text-xs text-white font-mono">{selectedNode.fz === 50 ? 'DIGITAL' : selectedNode.fz === -50 ? 'PHYSICAL' : 'ACTOR'}</div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                                <div className="text-[9px] text-zinc-500 font-mono mb-1">RISK INDEX</div>
                                                <div className={`text-xs font-mono ${selectedNode.type === 'Shock' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {selectedNode.type === 'Shock' ? 'HIGH' : 'LOW'}
                                                </div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                                <div className="text-[9px] text-zinc-500 font-mono mb-1">COMMENCE</div>
                                                <div className="text-xs text-white font-mono">{selectedNode.commencementDate || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-zinc-500 text-center py-10 font-mono">
                                    Select node to decrypt telemetry.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
