/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Activity, Server, Zap, Globe, Anchor, ShieldAlert, Cpu } from 'lucide-react';
import * as d3 from 'd3-force';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

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
        { id: "usa", type: "Actor", val: 6, color: "#e4e4e7", label: "United States", desc: "Strategic backer of IMEC via PGII to counter China's BRI." },
        { id: "india", type: "Actor", val: 6, color: "#e4e4e7", label: "India", desc: "Anchor economy leveraging IMEC to bypass Pakistan." },
        { id: "eu", type: "Actor", val: 5, color: "#e4e4e7", label: "European Union", desc: "Aligning IMEC with its €300 Billion Global Gateway fund." },
        { id: "ksa", type: "Actor", val: 5, color: "#e4e4e7", label: "Saudi Arabia", desc: "Crucial land bridge connecting the Gulf to the Levant." },
        { id: "uae", type: "Actor", val: 5, color: "#e4e4e7", label: "UAE", desc: "Pioneering the logistics network and funding Jordanian rails." },
        { id: "israel", type: "Actor", val: 4, color: "#e4e4e7", label: "Israel", desc: "The Mediterranean anchor point; provides overland redundancy." },
        { id: "china", type: "Actor", val: 6, color: "#e4e4e7", label: "China", desc: "Architect of the $8 Trillion BRI. Views IMEC as containment." },

        { id: "abraham_accords", type: "Framework", val: 4, color: "#e4e4e7", label: "Abraham Accords", desc: "Geopolitical normalization underpinning the overland routes." },
        { id: "pgii", type: "Framework", val: 3, color: "#e4e4e7", label: "G7 PGII", desc: "Partnership for Global Infrastructure and Investment." },
        { id: "global_gateway", type: "Framework", val: 3, color: "#e4e4e7", label: "EU Global Gateway", desc: "EU strategy to mobilize investments." },
        { id: "i2u2", type: "Framework", val: 3, color: "#e4e4e7", label: "I2U2 Group", desc: "India, Israel, UAE, and US partnership." },
        { id: "imec_announce", type: "Framework", val: 5, color: "#38bdf8", label: "IMEC Declaration", desc: "Formal announcement at G20 New Delhi." },

        { id: "palantir", type: "Actor", val: 5, color: "#e4e4e7", label: "Palantir Foundry", desc: "Military/intelligence data integration platform." },
        { id: "scaleai", type: "Actor", val: 4, color: "#e4e4e7", label: "ScaleAI", desc: "Data labeling for autonomous defense systems." },
        { id: "elbit", type: "Actor", val: 4, color: "#e4e4e7", label: "Elbit Systems", desc: "Defense contractor providing physical security infrastructure." },
        { id: "ai_dss", type: "Framework", val: 4, color: "#a855f7", label: "AI-DSS Protocol", desc: "Automated Decision Support Systems integrating global sensor nodes." },

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
        { source: "haifa", target: "blue_raman" },
        { source: "jebel_ali", target: "data_centers" },
        { source: "ksa", target: "neom_h2" },
        { source: "vadhavan", target: "jebel_ali" },
        { source: "jebel_ali", target: "al_ghuwaifat" },
        { source: "al_ghuwaifat", target: "al_haditha" },
        { source: "al_haditha", target: "mafraq" },
        { source: "mafraq", target: "beit_shean" },
        { source: "beit_shean", target: "haifa" },
        { source: "haifa", target: "piraeus" },
        { source: "piraeus", target: "marseille" },
        { source: "usa", target: "palantir" },
        { source: "israel", target: "elbit" },
        { source: "palantir", target: "ai_dss" },
        { source: "scaleai", target: "ai_dss" },
        { source: "ai_dss", target: "lavender" },
        { source: "usa", target: "project_nimbus" },
        { source: "project_nimbus", target: "israel" },
        { source: "project_nimbus", target: "lavender" },
        { source: "lavender", target: "automated_targeting" },
        { source: "project_nimbus", target: "data_centers" },
        { source: "gaza_war", target: "abraham_accords" },
        { source: "gaza_war", target: "red_sea" },
        { source: "red_sea", target: "suez_chokepoint" },
        { source: "china", target: "bri" },
        { source: "china", target: "peace_cable" },
        { source: "bri", target: "drp" },
        { source: "suez_chokepoint", target: "ben_gurion_canal" }
    ]
};

type FilterType = 'All' | 'Infrastructure' | 'Digital' | 'Geopolitical';

export default function NodeDatabase() {
    const fgRef = useRef<any>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const [zoomLevel, setZoomLevel] = useState<number>(1);

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
        const activeLinks = gData.links.filter(l =>
            nodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source) &&
            nodeIds.has(typeof l.target === 'object' ? (l.target as any).id : l.target)
        );

        return { nodes: activeNodes, links: activeLinks };
    }, [activeFilter]);

    useEffect(() => {
        if (fgRef.current) {
            const fg = fgRef.current;
            fg.d3Force('collide', d3.forceCollide().radius((node: any) => node.val * 2.5 + 4));
            fg.d3Force('charge').strength(-300);
            fg.d3Force('link').distance(60);
        }
    }, [filteredData]);

    const handleZoom = useCallback((transform: { k: number }) => {
        setZoomLevel(transform.k);
    }, []);

    const getNodeAbbreviation = (type: NodeType) => {
        switch (type) {
            case 'Actor': return 'ACT';
            case 'Framework': return 'FWK';
            case 'Logistics': return 'LOG';
            case 'Digital': return 'DIG';
            case 'Energy': return 'NRG';
            case 'Shock': return 'SHK';
            case 'Rival': return 'RVL';
            default: return 'UNK';
        }
    };

    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const radius = node.val * 1.5;
        const isActive = selectedNode?.id === node.id || hoveredNode?.id === node.id;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#09090b';
        ctx.fill();

        ctx.lineWidth = isActive ? 1.5 : 0.5;
        ctx.strokeStyle = node.color;
        ctx.stroke();

        ctx.font = `bold ${radius * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isActive ? '#ffffff' : node.color;
        ctx.fillText(getNodeAbbreviation(node.type), node.x, node.y);

        // Label rendering
        const showLabel = isActive || globalScale > 2;
        if (showLabel) {
            ctx.font = '4px monospace';
            ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(node.label, node.x, node.y + radius + 1.5);
        }
    }, [selectedNode, hoveredNode]);

    return (
        <div className="absolute inset-0 z-10 w-full h-screen bg-[#000000] overflow-hidden font-sans">

            {/* Header & Filter Row */}
            <div className="absolute top-6 left-6 z-40 mt-16 pt-2">
                <h1 className="text-xl font-mono font-bold tracking-tight text-white mb-4">
                    IMEC STRATEGIC ARCHITECTURE
                </h1>
                <div className="flex gap-2">
                    {(['All', 'Infrastructure', 'Digital', 'Geopolitical'] as FilterType[]).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all border ${activeFilter === filter
                                ? 'bg-white text-black border-white'
                                : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white backdrop-blur-md'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Graph */}
            <ForceGraph2D
                ref={fgRef}
                graphData={filteredData}
                nodeRelSize={4}
                nodeColor={n => n.color}
                linkColor={() => 'rgba(255, 255, 255, 0.15)'}
                linkWidth={0.5}
                linkDirectionalArrowLength={3}
                linkDirectionalArrowRelPos={1}
                nodeCanvasObject={nodeCanvasObject}
                onNodeHover={n => {
                    setHoveredNode(n as NodeData | null);
                    if (document.body) {
                        document.body.style.cursor = n ? 'pointer' : 'default';
                    }
                }}
                onNodeClick={n => setSelectedNode(n as NodeData)}
                onZoom={handleZoom}
                backgroundColor="#000000"
                d3AlphaDecay={0.01}
                d3VelocityDecay={0.2}
            />

            {/* Sidebar Context Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute top-24 right-6 w-[350px] bg-zinc-900/50 backdrop-blur-2xl border border-white/10 p-6 rounded-2xl shadow-2xl z-40 mt-2"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className={`px-2 py-1 border rounded text-[10px] uppercase tracking-widest font-mono mb-2 inline-block shadow-[0_0_10px_${selectedNode.color}40]`}
                                    style={{ borderColor: selectedNode.color, color: selectedNode.color, backgroundColor: `${selectedNode.color}15` }}
                                >
                                    {selectedNode.type}
                                </span>
                                <h2 className="text-xl font-bold tracking-tight text-white">{selectedNode.label}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="text-zinc-500 hover:text-white transition-colors p-1"
                            >
                                <X className="w-5 h-5" strokeWidth={1.2} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-1">Description</h3>
                                <p className="text-sm text-zinc-300 leading-relaxed font-mono">{selectedNode.desc}</p>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-2">Telemetry</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex flex-col justify-center">
                                        <div className="text-[10px] text-zinc-500 font-mono">WEIGHT OVERRIDE</div>
                                        <div className="text-lg font-mono text-cyan-400 mt-1">{selectedNode.val.toFixed(1)}x</div>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex flex-col justify-center">
                                        <div className="text-[10px] text-zinc-500 font-mono">NETWORK SECTOR</div>
                                        <div className="text-sm font-mono text-white mt-1 uppercase tracking-wider">{selectedNode.type}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
