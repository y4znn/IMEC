/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Anchor, Network, AlertTriangle, Lightbulb, Hexagon, SlidersHorizontal, Eye, Activity, Server, Zap, ShieldAlert, Swords } from 'lucide-react';
import * as d3 from 'd3-force';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

/* ══════════════════════════════════════════════════════════
   DATASET (Hardcoded IMEC Intelligence Data)
   ══════════════════════════════════════════════════════════ */

type NodeType = 'Actor' | 'Framework' | 'Logistics' | 'Digital' | 'Energy' | 'Shock' | 'Rival';

interface NodeData {
    id: string;
    label: string;
    type: NodeType;
    val: number;
    color: string;
    x?: number;
    y?: number;
    desc: string;
    details?: { key: string; value: string }[];
}

interface LinkData {
    source: string;
    target: string;
    label?: string;
}

const gData: { nodes: NodeData[]; links: LinkData[] } = {
    nodes: [
        // CATEGORY: GEOPOLITICAL ACTORS & FRAMEWORKS (Color: Muted Zinc/White)
        { id: "usa", type: "Actor", val: 6, color: "#e4e4e7", label: "United States", desc: "Strategic backer of IMEC via PGII to counter China's BRI and foster Middle East integration.", details: [] },
        { id: "india", type: "Actor", val: 6, color: "#e4e4e7", label: "India", desc: "Anchor economy leveraging IMEC to bypass Pakistan and access Europe.", details: [] },
        { id: "eu", type: "Actor", val: 5, color: "#e4e4e7", label: "European Union", desc: "Aligning IMEC with its €300 Billion Global Gateway fund to de-risk supply chains.", details: [] },
        { id: "ksa", type: "Actor", val: 5, color: "#e4e4e7", label: "Saudi Arabia", desc: "Crucial land bridge connecting the Gulf to the Levant; focal point for green energy transition.", details: [] },
        { id: "uae", type: "Actor", val: 5, color: "#e4e4e7", label: "UAE", desc: "Pioneering the logistics network and funding the $2.3B Jordanian railway link.", details: [] },
        { id: "israel", type: "Actor", val: 4, color: "#e4e4e7", label: "Israel", desc: "The Mediterranean anchor point; provides overland redundancy to the Suez Canal.", details: [] },
        { id: "china", type: "Actor", val: 6, color: "#e4e4e7", label: "China", desc: "Architect of the $8 Trillion BRI. Views IMEC as a systemic containment threat.", details: [] },
        { id: "pgii", type: "Framework", val: 3, color: "#e4e4e7", label: "G7 PGII", desc: "Partnership for Global Infrastructure and Investment; Western funding umbrella for IMEC.", details: [] },
        { id: "global_gateway", type: "Framework", val: 3, color: "#e4e4e7", label: "EU Global Gateway", desc: "EU strategy to mobilize up to €300 billion in investments for sustainable digital and transport connectivity.", details: [] },
        { id: "i2u2", type: "Framework", val: 3, color: "#e4e4e7", label: "I2U2 Group", desc: "India, Israel, UAE, and US partnership laying the geopolitical groundwork for integration.", details: [] },

        // CATEGORY: TRANSPORTATION PILLAR - PORTS & RAIL (Color: Steel Blue)
        { id: "vadhavan", type: "Logistics", val: 4, color: "#3b82f6", label: "Vadhavan Port (IND)", desc: "Upcoming $9B Indian mega-port projected to handle 23.2 million TEUs per annum.", details: [] },
        { id: "jebel_ali", type: "Logistics", val: 4, color: "#3b82f6", label: "Jebel Ali Port (UAE)", desc: "The largest port in the Middle East; primary maritime entry point for Indian goods.", details: [] },
        { id: "al_ghuwaifat", type: "Logistics", val: 2, color: "#3b82f6", label: "Al-Ghuwaifat Link", desc: "Crucial UAE-Saudi Arabia rail border crossing requiring network harmonization.", details: [] },
        { id: "al_haditha", type: "Logistics", val: 2, color: "#3b82f6", label: "Al-Haditha Hub", desc: "Key Saudi-Jordanian border logistics and transshipment hub.", details: [] },
        { id: "mafraq", type: "Logistics", val: 3, color: "#3b82f6", label: "Mafraq (JOR)", desc: "Jordanian logistical hub requiring significant structural investment.", details: [] },
        { id: "beit_shean", type: "Logistics", val: 3, color: "#3b82f6", label: "Beit She'an (ISR)", desc: "Vital rail junction connecting the Jordanian network to the Israeli coastal ports.", details: [] },
        { id: "haifa", type: "Logistics", val: 4, color: "#3b82f6", label: "Haifa Port (ISR)", desc: "Critical Mediterranean gateway; heavily modernized following acquisition by India's Adani Group.", details: [] },
        { id: "ashdod", type: "Logistics", val: 3, color: "#3b82f6", label: "Ashdod Port (ISR)", desc: "Secondary Mediterranean hub requiring a $2.57B coastal rail link to Haifa to handle IMEC volume.", details: [] },
        { id: "piraeus", type: "Logistics", val: 4, color: "#3b82f6", label: "Piraeus Port (GRE)", desc: "Major European entry point, though largely controlled by China's COSCO.", details: [] },
        { id: "marseille", type: "Logistics", val: 3, color: "#3b82f6", label: "Port of Marseille (FRA)", desc: "Key European terminus for both shipping and the TEAS data cables.", details: [] },

        // CATEGORY: DIGITAL PILLAR - DATA SOVEREIGNTY (Color: Amethyst Purple)
        { id: "blue_raman", type: "Digital", val: 5, color: "#a855f7", label: "Blue-Raman Cable", desc: "218 Tbps Google subsea fiber bypassing the Egyptian data chokepoint.", details: [] },
        { id: "teas", type: "Digital", val: 4, color: "#a855f7", label: "TEAS Network", desc: "Trans Europe Asia System; a 20,000 km terrestrial network linking Mumbai to Marseille.", details: [] },
        { id: "data_centers", type: "Digital", val: 3, color: "#a855f7", label: "AI Data Centers", desc: "High-compute nodes in the Gulf drawing on IMEC's digital and energy infrastructure.", details: [] },

        // CATEGORY: ENERGY PILLAR (Color: Emerald Green)
        { id: "neom_h2", type: "Energy", val: 4, color: "#10b981", label: "NEOM Green Hydrogen", desc: "$8.4B Saudi project aimed at exporting green ammonia to European markets.", details: [] },
        { id: "hvdc_interconnector", type: "Energy", val: 4, color: "#10b981", label: "UAE-India HVDC", desc: "Proposed High-Voltage Direct Current subsea cable to balance renewable grid loads.", details: [] },
        { id: "osowog", type: "Energy", val: 3, color: "#10b981", label: "OSOWOG Initiative", desc: "One Sun One World One Grid; establishing India as the fulcrum of an intercontinental power system.", details: [] },
        { id: "am_green", type: "Energy", val: 3, color: "#10b981", label: "AM Green & Rotterdam", desc: "Agreement enabling up to 1 million tons per year of green hydrogen trade between India and Europe.", details: [] },

        // CATEGORY: THREATS, SHOCKS & CHOKEPOINTS (Color: Muted Red)
        { id: "gaza_war", type: "Shock", val: 5, color: "#ef4444", label: "October 7 / Gaza War", desc: "Systemic shock stalling Saudi-Israeli normalization and immediate rail linkages.", details: [] },
        { id: "red_sea", type: "Shock", val: 5, color: "#ef4444", label: "Red Sea Crisis", desc: "Houthi attacks paralyzing Suez shipping, paradoxically validating IMEC's overland redundancy.", details: [] },
        { id: "suez_chokepoint", type: "Shock", val: 4, color: "#ef4444", label: "Suez Canal Vulnerability", desc: "Historical bottleneck handling 1.5 billion tons of cargo and 90% of Euro-Asia internet traffic.", details: [] },
        { id: "rubymar", type: "Shock", val: 3, color: "#ef4444", label: "MV Rubymar Incident", desc: "Sunken cargo ship that severed three intercontinental submarine data cables in 2024.", details: [] },
        { id: "jordan_finance_gap", type: "Shock", val: 3, color: "#ef4444", label: "$2B+ Jordan Rail Gap", desc: "Critical missing financial link to establish a standard-gauge network across Jordan.", details: [] },

        // CATEGORY: RIVAL ARCHITECTURES (Color: Muted Amber)
        { id: "bri", type: "Rival", val: 5, color: "#f59e0b", label: "Belt & Road Initiative", desc: "China's global infrastructure project. IMEC serves as the Western/Indian market-based alternative.", details: [] },
        { id: "drp", type: "Rival", val: 4, color: "#f59e0b", label: "Development Road Project", desc: "$17 Billion rail/highway network backed by Iraq and Turkey, designed to bypass IMEC.", details: [] },
        { id: "instc", type: "Rival", val: 3, color: "#f59e0b", label: "INSTC", desc: "Russia-Iran backed International North-South Transport Corridor.", details: [] },
        { id: "cpec", type: "Rival", val: 4, color: "#f59e0b", label: "CPEC", desc: "China-Pakistan Economic Corridor; a massive BRI flagship project bypassed by IMEC.", details: [] }
    ],
    links: [
        // Geopolitical Origins
        { source: "usa", target: "pgii" }, { source: "eu", target: "global_gateway" },
        { source: "india", target: "i2u2" }, { source: "uae", target: "i2u2" }, { source: "israel", target: "i2u2" },
        { source: "pgii", target: "vadhavan" }, { source: "global_gateway", target: "blue_raman" },

        // The Physical Logistics Route
        { source: "vadhavan", target: "jebel_ali" }, { source: "india", target: "jebel_ali" },
        { source: "jebel_ali", target: "al_ghuwaifat" }, { source: "al_ghuwaifat", target: "ksa" },
        { source: "ksa", target: "al_haditha" }, { source: "al_haditha", target: "mafraq" },
        { source: "mafraq", target: "jordan_finance_gap" }, { source: "jordan_finance_gap", target: "beit_shean" },
        { source: "beit_shean", target: "haifa" }, { source: "beit_shean", target: "ashdod" },
        { source: "ashdod", target: "haifa" }, { source: "haifa", target: "piraeus" },
        { source: "haifa", target: "marseille" },

        // Digital & Energy Spines
        { source: "india", target: "blue_raman" }, { source: "israel", target: "blue_raman" }, { source: "marseille", target: "blue_raman" },
        { source: "india", target: "teas" }, { source: "uae", target: "teas" }, { source: "ksa", target: "teas" }, { source: "marseille", target: "teas" },
        { source: "blue_raman", target: "data_centers" }, { source: "teas", target: "data_centers" },
        { source: "ksa", target: "neom_h2" }, { source: "neom_h2", target: "eu" },
        { source: "india", target: "hvdc_interconnector" }, { source: "uae", target: "hvdc_interconnector" },
        { source: "india", target: "osowog" }, { source: "india", target: "am_green" },

        // Shocks & Vulnerabilities
        { source: "gaza_war", target: "red_sea" }, { source: "red_sea", target: "suez_chokepoint" },
        { source: "red_sea", target: "rubymar" }, { source: "rubymar", target: "blue_raman" },
        { source: "suez_chokepoint", target: "haifa" }, // Shows Haifa as the redundancy bypass

        // Rivalries
        { source: "china", target: "bri" }, { source: "bri", target: "drp" },
        { source: "bri", target: "cpec" }, { source: "instc", target: "india" }
    ]
};

// Map type to icons
const getTypeIcon = (type: NodeType) => {
    switch (type) {
        case 'Actor': return Network;
        case 'Framework': return Hexagon;
        case 'Logistics': return Anchor;
        case 'Digital': return Server;
        case 'Energy': return Zap;
        case 'Shock': return ShieldAlert;
        case 'Rival': return Swords;
        default: return Hexagon;
    }
};

export default function NodeDatabase() {
    const fgRef = useRef<any>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
    const [hoveredLinks, setHoveredLinks] = useState<Set<LinkData>>(new Set());

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<NodeType | 'All'>('All');
    const [isControlsOpen, setIsControlsOpen] = useState(false);

    // Physics Engine Controls (AI War Cloud inspired)
    const [chargeStrength, setChargeStrength] = useState(-400);
    const [linkDistance, setLinkDistance] = useState(60);
    const [collisionRadius, setCollisionRadius] = useState(25);

    useEffect(() => {
        // Apply physics constraints to active D3 Simulation when controls change
        if (fgRef.current) {
            const fg = fgRef.current;
            fg.d3Force('charge').strength(chargeStrength);
            fg.d3Force('link').distance(linkDistance);
            fg.d3Force('collide', d3.forceCollide(collisionRadius));
            fg.d3ReheatSimulation();
        }
    }, [chargeStrength, linkDistance, collisionRadius]);

    // Filter logic
    const filteredData = useMemo(() => {
        let nodes = gData.nodes;
        if (activeFilter !== 'All') {
            nodes = nodes.filter(n => n.type === activeFilter);
        }
        if (searchQuery) {
            nodes = nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        const nodeIds = new Set(nodes.map(n => n.id));
        const links = gData.links.filter(l => nodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source) && nodeIds.has(typeof l.target === 'object' ? (l.target as any).id : l.target));

        return { nodes, links };
    }, [activeFilter, searchQuery]);

    // Graph interactions
    const handleNodeHover = useCallback((node: NodeData | null) => {
        setHoveredNode(node);
        if (node) {
            const connectedLinks = new Set<LinkData>();
            gData.links.forEach(l => {
                const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                if (s === node.id || t === node.id) {
                    connectedLinks.add(l);
                }
            });
            setHoveredLinks(connectedLinks);
        } else {
            setHoveredLinks(new Set());
        }
    }, []);

    const handleNodeClick = useCallback((node: NodeData) => {
        setSelectedNode(node);
        // Center camera smoothly
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(2.5, 1000);
        }
    }, [fgRef]);

    return (
        <div className="absolute inset-0 z-10 w-full h-screen bg-zinc-950 overflow-hidden font-sans">

            {/* ── Force Graph ── */}
            <div className="absolute inset-0 cursor-crosshair">
                <ForceGraph2D
                    ref={fgRef}
                    graphData={filteredData}
                    nodeRelSize={4}
                    d3AlphaDecay={0.01}
                    d3VelocityDecay={0.2}
                    onNodeHover={(n) => handleNodeHover(n as NodeData)}
                    onNodeClick={(n) => handleNodeClick(n as NodeData)}
                    // Custom Node Drawing
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const isHovered = node === hoveredNode;
                        const isSelected = node === selectedNode;
                        const isDimmed = (hoveredNode && !isHovered && !Array.from(hoveredLinks).some(l => (l.source as any).id === node.id || (l.target as any).id === node.id));

                        const r = Math.sqrt(node.val) * 2;

                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fillStyle = isDimmed ? '#18181b' : node.color; // dim to zinc-900 if not focused
                        ctx.fill();

                        if (isHovered || isSelected) {
                            ctx.strokeStyle = '#fff';
                            ctx.lineWidth = 1.5 / globalScale;
                            ctx.stroke();

                            // Draw outer glow aura
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
                            ctx.fillStyle = `${node.color}33`;
                            ctx.fill();
                        }

                        // Label
                        if (!isDimmed) {
                            const label = node.label;
                            const fontSize = (isSelected || isHovered) ? 14 / globalScale : 11 / globalScale;
                            ctx.font = `${fontSize}px Inter, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = (isSelected || isHovered) ? '#ffffff' : '#a1a1aa';
                            ctx.fillText(label, node.x, node.y + r + (6 / globalScale));
                        }
                    }}
                    // Custom Link Drawing
                    linkDirectionalParticles={1}
                    linkDirectionalParticleWidth={(l) => hoveredLinks.has(l as any) ? 2 : 0}
                    linkWidth={(l) => hoveredLinks.has(l as any) ? 1.5 : 0.5}
                    linkColor={(l) => hoveredLinks.has(l as any) ? '#22d3ee' : 'rgba(255,255,255,0.05)'} // Cyan for hover
                />
            </div>

            {/* ── Overlay: Floating Search & Filter Bar ── */}
            <div className="absolute top-24 left-6 z-20 pointer-events-auto">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl w-80">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search intelligence database..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Filter by Node Type</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['All', 'Actor', 'Framework', 'Logistics', 'Digital', 'Energy', 'Shock', 'Rival'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setActiveFilter(type as any)}
                                className={`px-3 py-1 text-[10px] uppercase font-mono rounded-full border transition-all ${activeFilter === type
                                    ? 'bg-zinc-200 text-black border-zinc-200 font-bold'
                                    : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Overlay: Physics Engine Controls ── */}
            <div className="absolute top-6 right-6 z-20 pointer-events-auto">
                <button
                    onClick={() => setIsControlsOpen(!isControlsOpen)}
                    className="mb-4 ml-auto flex items-center justify-center gap-2 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 cursor-pointer transition-colors shadow-2xl"
                >
                    <SlidersHorizontal className="w-4 h-4 text-zinc-300" />
                    <span className="text-xs font-mono text-zinc-300 uppercase tracking-widest">Physics Controls</span>
                </button>

                <AnimatePresence>
                    {isControlsOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="w-72 bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 shadow-2xl ml-auto"
                        >
                            <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity className="w-3 h-3" />
                                Graph Simulation Engine
                            </h3>

                            <div className="space-y-5">
                                {/* Charge Strength */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono text-zinc-400">
                                        <span>Repulsion Force</span>
                                        <span>{chargeStrength}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-1000"
                                        max="-50"
                                        value={chargeStrength}
                                        onChange={(e) => setChargeStrength(Number(e.target.value))}
                                        className="w-full accent-emerald-500 bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Link Distance */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono text-zinc-400">
                                        <span>Link Distance</span>
                                        <span>{linkDistance}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="300"
                                        value={linkDistance}
                                        onChange={(e) => setLinkDistance(Number(e.target.value))}
                                        className="w-full accent-emerald-500 bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Collision Radius */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono text-zinc-400">
                                        <span>Collision Radius</span>
                                        <span>{collisionRadius}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="100"
                                        value={collisionRadius}
                                        onChange={(e) => setCollisionRadius(Number(e.target.value))}
                                        className="w-full accent-emerald-500 bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setChargeStrength(-400);
                                        setLinkDistance(60);
                                        setCollisionRadius(25);
                                    }}
                                    className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-zinc-400 font-mono transition-colors"
                                >
                                    Reset Default Physics
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Overlay: Database Dossier Side Panel ── */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-24 right-6 bottom-6 w-96 bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl p-6 z-30 pointer-events-auto flex flex-col"
                    >
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Header */}
                        <div className="mb-6 pr-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                    style={{ backgroundColor: selectedNode.color }}
                                />
                                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                                    {selectedNode.type} NODE
                                </span>
                            </div>
                            <h2
                                className="text-2xl font-semibold text-zinc-100 tracking-tight"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                {selectedNode.label}
                            </h2>
                        </div>

                        {/* Description */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 mb-6">
                            <p className="text-sm text-zinc-300 leading-relaxed font-light">
                                {selectedNode.desc}
                            </p>
                        </div>

                        {/* Details */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                                Classified Intelligence
                            </h3>
                            <div className="space-y-3">
                                {selectedNode.details && selectedNode.details.map((detail, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-zinc-500 font-mono">{detail.key}</span>
                                        <span className="text-zinc-200 font-medium text-right max-w-[60%] truncate">{detail.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer decorative */}
                        <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between opacity-50">
                            <div className="flex items-center gap-2">
                                <Hexagon className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1} />
                                <span className="text-[10px] font-mono text-zinc-500">ID: {selectedNode.id.toUpperCase()}</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
}
