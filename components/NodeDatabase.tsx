/* eslint-disable @typescript-eslint/no-explicit-any */
// removed unused vars directive

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network } from 'lucide-react';
import * as d3 from 'd3-force';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

/* ══════════════════════════════════════════════════════════
   SYNCHRONOUS ICON PRELOADING
   ══════════════════════════════════════════════════════════ */

const ICONS = {
    Actor: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
    Framework: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>`,
    Logistics: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/></svg>`,
    Digital: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
    Energy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    Shock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    Rival: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`
};

const iconImages: Record<string, HTMLImageElement> = {};
if (typeof window !== 'undefined') {
    Object.entries(ICONS).forEach(([type, svg]) => {
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        iconImages[type] = img;
    });
}

/* ══════════════════════════════════════════════════════════
   DATASET
   ══════════════════════════════════════════════════════════ */

type NodeType = 'Actor' | 'Framework' | 'Logistics' | 'Digital' | 'Energy' | 'Shock' | 'Rival';

interface NodeData {
    id: string;
    label: string;
    type: NodeType;
    val: number;
    color: string;
    desc: string;
    x?: number;
    y?: number;
    fx?: number;
    fy?: number;
}

interface LinkData {
    source: string;
    target: string;
}

const gData: { nodes: NodeData[]; links: LinkData[] } = {
    nodes: [
        { id: "usa", type: "Actor", val: 6, color: "#ffffff", label: "United States", desc: "Strategic backer of IMEC via PGII to counter China's BRI." },
        { id: "india", type: "Actor", val: 6, color: "#ffffff", label: "India", desc: "Anchor economy leveraging IMEC to bypass Pakistan." },
        { id: "eu", type: "Actor", val: 5, color: "#ffffff", label: "European Union", desc: "Aligning IMEC with its €300 Billion Global Gateway fund." },
        { id: "ksa", type: "Actor", val: 5, color: "#ffffff", label: "Saudi Arabia", desc: "Crucial land bridge connecting the Gulf to the Levant." },
        { id: "uae", type: "Actor", val: 5, color: "#ffffff", label: "UAE", desc: "Pioneering the logistics network and funding Jordanian rails." },
        { id: "israel", type: "Actor", val: 4, color: "#ffffff", label: "Israel", desc: "The Mediterranean anchor point; provides overland redundancy." },
        { id: "china", type: "Actor", val: 6, color: "#ffffff", label: "China", desc: "Architect of the $8 Trillion BRI. Views IMEC as containment." },

        { id: "abraham_accords", type: "Framework", val: 4, color: "#e4e4e7", label: "Abraham Accords", desc: "Geopolitical normalization underpinning the overland routes." },
        { id: "pgii", type: "Framework", val: 3, color: "#e4e4e7", label: "G7 PGII", desc: "Partnership for Global Infrastructure and Investment." },
        { id: "global_gateway", type: "Framework", val: 3, color: "#e4e4e7", label: "EU Global Gateway", desc: "EU strategy to mobilize investments." },
        { id: "i2u2", type: "Framework", val: 3, color: "#e4e4e7", label: "I2U2 Group", desc: "India, Israel, UAE, and US partnership." },
        { id: "imec_announce", type: "Framework", val: 5, color: "#e4e4e7", label: "IMEC Declaration", desc: "Formal announcement at G20 New Delhi." },

        { id: "palantir", type: "Actor", val: 5, color: "#ffffff", label: "Palantir Foundry", desc: "Military/intelligence data integration platform." },
        { id: "scaleai", type: "Actor", val: 4, color: "#ffffff", label: "ScaleAI", desc: "Data labeling for autonomous defense systems." },
        { id: "elbit", type: "Actor", val: 4, color: "#ffffff", label: "Elbit Systems", desc: "Defense contractor providing physical security infrastructure." },
        { id: "ai_dss", type: "Framework", val: 4, color: "#e4e4e7", label: "AI-DSS Protocol", desc: "Automated Decision Support Systems integrating global sensor nodes." },

        { id: "vadhavan", type: "Logistics", val: 4, color: "#3b82f6", label: "Vadhavan Port", desc: "Upcoming $9B Indian mega-port." },
        { id: "jebel_ali", type: "Logistics", val: 4, color: "#3b82f6", label: "Jebel Ali Port", desc: "The largest port in the Middle East." },
        { id: "al_ghuwaifat", type: "Logistics", val: 2, color: "#3b82f6", label: "Al-Ghuwaifat Link", desc: "Crucial UAE-Saudi Arabia rail border crossing." },
        { id: "al_haditha", type: "Logistics", val: 2, color: "#3b82f6", label: "Al-Haditha Hub", desc: "Key Saudi-Jordanian border transshipment." },
        { id: "mafraq", type: "Logistics", val: 3, color: "#3b82f6", label: "Mafraq (JOR)", desc: "Jordanian logistical hub." },
        { id: "beit_shean", type: "Logistics", val: 3, color: "#3b82f6", label: "Beit She'an (ISR)", desc: "Vital rail junction connecting Jordan to Israel." },
        { id: "haifa", type: "Logistics", val: 5, color: "#3b82f6", label: "Haifa Port", desc: "Critical Mediterranean gateway, acquired by Adani." },
        { id: "piraeus", type: "Logistics", val: 4, color: "#3b82f6", label: "Piraeus Port", desc: "Major European entry point, controlled by COSCO." },
        { id: "marseille", type: "Logistics", val: 3, color: "#3b82f6", label: "Port of Marseille", desc: "Key European terminus for shipping and cables." },
        { id: "ben_gurion_canal", type: "Logistics", val: 4, color: "#3b82f6", label: "Ben Gurion Canal", desc: "Theoretical Israeli alternative to the Suez Canal." },

        { id: "blue_raman", type: "Digital", val: 5, color: "#a855f7", label: "Blue-Raman Cable", desc: "218 Tbps Google subsea fiber bypassing Egypt." },
        { id: "teas", type: "Digital", val: 4, color: "#a855f7", label: "TEAS Network", desc: "Trans Europe Asia System linking Mumbai to Marseille." },
        { id: "data_centers", type: "Digital", val: 4, color: "#a855f7", label: "Gulf AI Data Centers", desc: "High-compute nodes in UAE/KSA drawing on IMEC." },
        { id: "project_nimbus", type: "Digital", val: 5, color: "#a855f7", label: "Project Nimbus", desc: "$1.2B cloud computing project by Google/Amazon." },
        { id: "lavender", type: "Digital", val: 4, color: "#a855f7", label: "Lavender AI", desc: "Automated targeting system deployed in asymmetric conflict." },
        { id: "peace_cable", type: "Digital", val: 4, color: "#a855f7", label: "PEACE Cable", desc: "Chinese-backed digital backbone penetrating the Mediterranean." },

        { id: "neom_h2", type: "Energy", val: 4, color: "#10b981", label: "NEOM Green Hydrogen", desc: "$8.4B Saudi project aimed at exporting green ammonia." },
        { id: "hvdc_interconnector", type: "Energy", val: 4, color: "#10b981", label: "UAE-India HVDC", desc: "Proposed High-Voltage Direct Current subsea cable." },

        { id: "gaza_war", type: "Shock", val: 6, color: "#ef4444", label: "Gaza War", desc: "Systemic shock stalling normalization." },
        { id: "red_sea", type: "Shock", val: 5, color: "#ef4444", label: "Red Sea Crisis", desc: "Houthi attacks paralyzing Suez shipping." },
        { id: "suez_chokepoint", type: "Shock", val: 4, color: "#ef4444", label: "Suez Vulnerability", desc: "Historical maritime bottleneck." },
        { id: "automated_targeting", type: "Shock", val: 4, color: "#ef4444", label: "AI Target Bleed", desc: "Algorithms executing lethal targeting without human loops." },

        { id: "bri", type: "Rival", val: 5, color: "#f59e0b", label: "Belt & Road Initiative", desc: "China's global infrastructure project." },
        { id: "drp", type: "Rival", val: 4, color: "#f59e0b", label: "Development Road", desc: "$17 Billion Iraq-Turkey rail bypass." },
    ],
    links: [
        { source: "israel", target: "abraham_accords" }, { source: "uae", target: "abraham_accords" },
        { source: "abraham_accords", target: "i2u2" }, { source: "india", target: "i2u2" },
        { source: "i2u2", target: "imec_announce" }, { source: "eu", target: "imec_announce" },
        { source: "haifa", target: "blue_raman" }, { source: "jebel_ali", target: "data_centers" },
        { source: "ksa", target: "neom_h2" }, { source: "vadhavan", target: "jebel_ali" },
        { source: "jebel_ali", target: "al_ghuwaifat" }, { source: "al_ghuwaifat", target: "al_haditha" },
        { source: "al_haditha", target: "mafraq" }, { source: "mafraq", target: "beit_shean" },
        { source: "beit_shean", target: "haifa" }, { source: "haifa", target: "piraeus" },
        { source: "piraeus", target: "marseille" }, { source: "usa", target: "palantir" },
        { source: "israel", target: "elbit" }, { source: "palantir", target: "ai_dss" },
        { source: "scaleai", target: "ai_dss" }, { source: "ai_dss", target: "lavender" },
        { source: "usa", target: "project_nimbus" }, { source: "project_nimbus", target: "israel" },
        { source: "project_nimbus", target: "lavender" }, { source: "lavender", target: "automated_targeting" },
        { source: "project_nimbus", target: "data_centers" }, { source: "gaza_war", target: "abraham_accords" },
        { source: "gaza_war", target: "red_sea" }, { source: "red_sea", target: "suez_chokepoint" },
        { source: "china", target: "bri" }, { source: "china", target: "peace_cable" },
        { source: "bri", target: "drp" }, { source: "suez_chokepoint", target: "ben_gurion_canal" }
    ]
};

type FilterType = 'All' | 'Infrastructure' | 'Digital' | 'Geopolitical';

export default function NodeDatabase() {
    const fgRef = useRef<any>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');

    // Memos for interactive connections
    const neighbors = useMemo(() => {
        const map = new Map<string, Set<string>>();
        gData.links.forEach(link => {
            const source = typeof link.source === 'object' ? (link.source as any).id : link.source;
            const target = typeof link.target === 'object' ? (link.target as any).id : link.target;

            if (!map.has(source)) map.set(source, new Set());
            if (!map.has(target)) map.set(target, new Set());

            map.get(source)!.add(target);
            map.get(target)!.add(source);
        });
        return map;
    }, []);

    const filteredData = useMemo(() => {
        let activeNodes = gData.nodes;
        if (activeFilter === 'Infrastructure') {
            activeNodes = activeNodes.filter(n => n.type === 'Logistics' || n.type === 'Energy');
        } else if (activeFilter === 'Digital') {
            activeNodes = activeNodes.filter(n => n.type === 'Digital');
        } else if (activeFilter === 'Geopolitical') {
            activeNodes = activeNodes.filter(n => n.type === 'Actor' || n.type === 'Framework' || n.type === 'Shock' || n.type === 'Rival');
        }

        const nodeIds = new Set(activeNodes.map(n => n.id));
        const activeLinks = gData.links.filter(l => {
            const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return nodeIds.has(sourceId) && nodeIds.has(targetId);
        });

        return { nodes: activeNodes, links: activeLinks };
    }, [activeFilter]);

    useEffect(() => {
        if (fgRef.current) {
            const fg = fgRef.current;
            fg.d3Force('charge').strength(-400);
            fg.d3Force('collide', d3.forceCollide().radius((node: any) => node.val * 2.5 + 12));
            fg.d3Force('link').distance(80);
            fg.d3ReheatSimulation();
        }
    }, [filteredData]);

    // Canvas Renderers
    const getOpacity = useCallback((nodeId: string) => {
        if (!hoveredNode && !selectedNode) return 1.0;
        const activeNode = hoveredNode || selectedNode;
        if (!activeNode) return 1.0;

        if (nodeId === activeNode.id) return 1.0;
        if (neighbors.get(activeNode.id)?.has(nodeId)) return 1.0;

        return 0.1;
    }, [hoveredNode, selectedNode, neighbors]);

    const getLinkOpacity = useCallback((sourceId: string, targetId: string) => {
        if (!hoveredNode && !selectedNode) return 0.15; // default subtle state
        const activeNode = hoveredNode || selectedNode;
        if (!activeNode) return 0.15;

        if (sourceId === activeNode.id || targetId === activeNode.id) return 0.8;
        return 0.05;
    }, [hoveredNode, selectedNode]);

    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const radius = node.val * 2;
        const opacity = getOpacity(node.id);
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        ctx.globalAlpha = opacity;

        // Base Circle Fill first to prevent link bleed
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#09090b';
        ctx.fill();

        // Border
        ctx.lineWidth = 1;
        ctx.strokeStyle = node.color;
        ctx.stroke();

        // Draw SVG pre-loaded Image
        const img = iconImages[node.type];
        if (img && img.complete) {
            const iconSize = radius * 1.4;
            // Draw image slightly dimmed unless hovered/selected for high-contrast obsidian aesthetic
            ctx.globalAlpha = (isHovered || isSelected) ? 1.0 : opacity * 0.8;
            ctx.drawImage(img, node.x - iconSize / 2, node.y - iconSize / 2, iconSize, iconSize);
            ctx.globalAlpha = opacity; // restoring for the rest of drawing
        }

        // Target Crosshair radar rings (Simulated by simple dashed rings if selected)
        if (isSelected) {
            const time = Date.now() / 1000;
            ctx.save();
            ctx.translate(node.x, node.y);
            ctx.rotate(time * 0.5);
            ctx.beginPath();
            ctx.setLineDash([1, 2]);
            ctx.arc(0, 0, radius + 3, 0, 2 * Math.PI);
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.rotate(-time * 1.2);
            ctx.beginPath();
            ctx.setLineDash([2, 4]);
            ctx.arc(0, 0, radius + 6, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
        }

        // Smart Labels
        const isMajorActor = node.type === 'Actor' && node.val >= 5;
        // Show if Major Actor, OR hovered/selected, OR if zoomed in really far mapping dense regions
        const showLabel = isHovered || isSelected || isMajorActor || (globalScale > 3);

        if (showLabel) {
            ctx.save();
            ctx.font = '4px "JetBrains Mono", monospace';
            ctx.fillStyle = (isHovered || isSelected) ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(node.label, node.x, node.y + radius + 3);
            ctx.restore();
        }

        ctx.globalAlpha = 1.0;
    }, [hoveredNode, selectedNode, getOpacity]);

    return (
        <div className="absolute inset-0 z-10 w-full h-screen bg-[#000000] overflow-hidden font-sans">

            {/* Global Polish: CRT Scanlines specific to this component overlay */}
            <style>{`
                @keyframes scanlines {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                .crt-panel {
                    pointer-events: none;
                    position: absolute;
                    inset: 0;
                    z-index: 50;
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
                    background-size: 100% 4px;
                }
                .crt-scanline {
                    width: 100%;
                    height: 15px;
                    background: rgba(255, 255, 255, 0.02);
                    opacity: 0.5;
                    position: absolute;
                    top: 0;
                    animation: scanlines 6s linear infinite;
                }
            `}</style>

            <div className="crt-panel">
                <div className="crt-scanline" />
            </div>

            {/* Header (Top Left) */}
            <div className="absolute top-6 left-6 z-40 mt-16 pt-2 pointer-events-auto">
                <h1 className="text-2xl font-['Playfair_Display'] font-bold tracking-tight text-white mb-1">
                    IMEC STRATEGIC ARCHITECTURE
                </h1>
                <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
                    Infrastructure & Intelligence Mapping
                </p>
            </div>

            {/* Filter Taxonomy (Bottom Left) */}
            <div className="absolute bottom-10 left-6 z-40 pointer-events-auto">
                <div className="flex gap-2">
                    {(['All', 'Infrastructure', 'Digital', 'Geopolitical'] as FilterType[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-none text-[10px] font-mono tracking-widest uppercase transition-all border ${activeFilter === filter
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-zinc-400 border-white/20 hover:border-white/60 hover:text-white backdrop-blur-md'
                                }`}
                        >
                            [ {filter} ]
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Forensic Canvas */}
            <ForceGraph2D
                ref={fgRef}
                graphData={filteredData}
                nodeRelSize={4}
                linkColor={(link) => {
                    const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
                    const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
                    const opacity = getLinkOpacity(sourceId, targetId);
                    return `rgba(255, 255, 255, ${opacity})`;
                }}
                linkWidth={0.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={1.5}
                linkDirectionalParticleColor={(link) => {
                    const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
                    const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
                    const opacity = getLinkOpacity(sourceId, targetId);
                    return `rgba(255, 255, 255, ${opacity >= 0.5 ? 0.8 : 0.2})`;
                }}
                nodeCanvasObject={nodeCanvasObject}
                onNodeHover={n => {
                    setHoveredNode(n as NodeData | null);
                    if (document.body) {
                        document.body.style.cursor = n ? 'pointer' : 'default';
                    }
                }}
                onNodeClick={n => setSelectedNode(n as NodeData)}
                onBackgroundClick={() => setSelectedNode(null)}
                backgroundColor="#000000"
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
            />

            {/* Forensic Dossier Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute right-0 top-0 w-[400px] h-screen bg-zinc-950/90 backdrop-blur-2xl border-l border-white/10 p-8 shadow-2xl z-40 overflow-y-auto pointer-events-auto pt-24"
                    >
                        <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
                            <div>
                                <span className={`px-2 py-1 border rounded-sm text-[10px] uppercase tracking-widest font-mono mb-4 inline-block shadow-[0_0_10px_${selectedNode.color}20]`}
                                    style={{ borderColor: selectedNode.color, color: selectedNode.color, backgroundColor: `${selectedNode.color}10` }}
                                >
                                    {selectedNode.type} NODE
                                </span>
                                <h2 className="text-3xl font-['Playfair_Display'] font-bold tracking-tight text-white leading-tight">
                                    {selectedNode.label}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="text-zinc-500 hover:text-white transition-colors mt-1"
                            >
                                <X className="w-5 h-5" strokeWidth={1.2} />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-black/50 p-5 rounded-lg border border-white/5">
                                <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2 flex items-center gap-2">
                                    <Network className="w-3 h-3" strokeWidth={1.2} /> Primary Intel
                                </h3>
                                <p className="text-sm text-zinc-300 leading-relaxed font-sans font-light tracking-wide">
                                    {selectedNode.desc}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-3 py-2 border-b border-white/5">
                                    Direct Geopolitical Dependencies
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {Array.from(neighbors.get(selectedNode.id) || []).map(neighborId => {
                                        const neighbor = gData.nodes.find(n => n.id === neighborId);
                                        if (!neighbor) return null;
                                        return (
                                            <button
                                                key={neighbor.id}
                                                onClick={() => setSelectedNode(neighbor)}
                                                className="group flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-md hover:bg-black/60 hover:border-white/20 transition-all text-left"
                                            >
                                                <span className="text-sm font-sans text-white font-medium">{neighbor.label}</span>
                                                <span
                                                    className="text-[9px] uppercase tracking-widest font-mono"
                                                    style={{ color: neighbor.color }}
                                                >
                                                    {neighbor.type}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
