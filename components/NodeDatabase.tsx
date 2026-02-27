/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import React, { useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Anchor, Network, AlertTriangle, Lightbulb, Hexagon } from 'lucide-react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

/* ══════════════════════════════════════════════════════════
   DATASET (Hardcoded IMEC Intelligence Data)
   ══════════════════════════════════════════════════════════ */

type NodeType = 'Actor' | 'Infrastructure' | 'Event' | 'Concept';

interface NodeData {
    id: string;
    label: string;
    type: NodeType;
    val: number;
    color: string;
    x?: number;
    y?: number;
    desc: string;
    details: { key: string; value: string }[];
}

interface LinkData {
    source: string;
    target: string;
    label?: string;
}

const gData: { nodes: NodeData[]; links: LinkData[] } = {
    nodes: [
        // Actors
        { id: 'us', label: 'United States', type: 'Actor', val: 8, color: '#0ea5e9', desc: 'Primary backer of IMEC meant to counter China.', details: [{ key: 'Strategic Goal', value: 'Containment of BRI' }] },
        { id: 'in', label: 'India', type: 'Actor', val: 8, color: '#0ea5e9', desc: 'Eastern anchor seeking market access to EU.', details: [{ key: 'Economic Impact', value: '+40% Export Speed' }] },
        { id: 'eu', label: 'European Union', type: 'Actor', val: 7, color: '#0ea5e9', desc: 'Western anchor seeking energy security.', details: [{ key: 'Funding', value: '€300B Global Gateway' }] },
        { id: 'sa', label: 'Saudi Arabia', type: 'Actor', val: 7, color: '#0ea5e9', desc: 'Crucial land bridge connecting sea to rail.', details: [{ key: 'Investment', value: '$20B Infrastructure' }] },
        { id: 'uae', label: 'UAE', type: 'Actor', val: 6, color: '#0ea5e9', desc: 'Primary maritime transshipment hub.', details: [{ key: 'Key Asset', value: 'Jebel Ali Port' }] },
        { id: 'il', label: 'Israel', type: 'Actor', val: 6, color: '#0ea5e9', desc: 'Mediterranean exit point, politically sensitive.', details: [{ key: 'Key Asset', value: 'Haifa Port' }] },
        { id: 'cn', label: 'China', type: 'Actor', val: 8, color: '#ef4444', desc: 'Systemic rival whose BRI strategy prompted IMEC.', details: [{ key: 'Strategic Goal', value: 'Eurasian Hegemony' }] },
        { id: 'tr', label: 'Turkey', type: 'Actor', val: 5, color: '#f59e0b', desc: 'Excluded from IMEC, pushing rival corridor.', details: [{ key: 'Response', value: 'Development Road Project' }] },
        { id: 'ir', label: 'Iran', type: 'Actor', val: 5, color: '#f59e0b', desc: 'Pushing INSTC with Russia, threatening Straits.', details: [{ key: 'Alliance', value: 'Sino-Russian Axis' }] },

        // Infrastructure
        { id: 'haifa', label: 'Haifa Port', type: 'Infrastructure', val: 6, color: '#10b981', desc: 'Secured by Adani Group, main Med port.', details: [{ key: 'Capacity', value: '3M TEU' }, { key: 'Operator', value: 'Adani Group (India)' }] },
        { id: 'jebel_ali', label: 'Jebel Ali Port', type: 'Infrastructure', val: 6, color: '#10b981', desc: 'Largest port in the Middle East.', details: [{ key: 'Capacity', value: '19.3M TEU' }] },
        { id: 'piraeus', label: 'Piraeus Port', type: 'Infrastructure', val: 5, color: '#10b981', desc: 'Greek port, heavily owned by Chinese COSCO.', details: [{ key: 'Ownership', value: '67% COSCO (China)' }] },
        { id: 'blue_raman', label: 'Blue-Raman Cable', type: 'Infrastructure', val: 6, color: '#a855f7', desc: 'Google-backed digital corridor bypassing Egypt.', details: [{ key: 'Capacity', value: '218 Tbps' }, { key: 'Backer', value: 'Google / Sparkle' }] },
        { id: 'drp', label: 'Development Road', type: 'Infrastructure', val: 5, color: '#f59e0b', desc: 'Turkey-Iraq rail project to rival IMEC.', details: [{ key: 'Cost', value: '$17 Billion' }] },
        { id: 'instc', label: 'INSTC Corridor', type: 'Infrastructure', val: 5, color: '#ef4444', desc: 'Iran-Russia network avoiding Western sanctions.', details: [{ key: 'Status', value: 'Active/Expanding' }] },
        { id: 'suez', label: 'Suez Canal', type: 'Infrastructure', val: 7, color: '#64748b', desc: 'Legacy chokepoint IMEC aims to bypass.', details: [{ key: 'Current Threat', value: 'Houthi Blockade' }] },

        // Events
        { id: 'g20', label: 'G20 MOU (2023)', type: 'Event', val: 4, color: '#eab308', desc: 'Official launch of IMEC doctrine.', details: [{ key: 'Location', value: 'New Delhi' }] },
        { id: 'gaza_war', label: 'Gaza War (Oct 7)', type: 'Event', val: 5, color: '#eab308', desc: 'Paused normalization, threatening IMEC land route.', details: [{ key: 'Impact', value: 'Severe Delay' }] },
        { id: 'red_sea', label: 'Red Sea Crisis', type: 'Event', val: 5, color: '#eab308', desc: 'Houthi attacks paralyzing maritime trade.', details: [{ key: 'Impact', value: 'Validates IMEC overland redundancy' }] },
        { id: 'abraham', label: 'Abraham Accords', type: 'Event', val: 4, color: '#eab308', desc: 'Normalization groundwork enabling IMEC.', details: [{ key: 'Signatories', value: 'Israel, UAE, Bahrain' }] },

        // Concepts
        { id: 'redundancy', label: 'Supply Chain Redundancy', type: 'Concept', val: 5, color: '#6366f1', desc: 'Need for multi-modal bypasses of chokepoints.', details: [{ key: 'Theoretical Base', value: 'Systems Theory' }] },
        { id: 'geoecon', label: 'Geoeconomic Warfare', type: 'Concept', val: 5, color: '#6366f1', desc: 'Using trade routes as weapons of influence.', details: [{ key: 'Examples', value: 'BRI, IMEC, Sanctions' }] },
        { id: 'multipolarity', label: 'Multipolarity', type: 'Concept', val: 4, color: '#6366f1', desc: 'Desire of Middle Powers to avoid choosing sides.', details: [{ key: 'Practitioners', value: 'India, UAE, Saudi Arabia' }] },
    ],
    links: [
        { source: 'us', target: 'in', label: 'Partnership' },
        { source: 'us', target: 'g20' },
        { source: 'in', target: 'g20' },
        { source: 'sa', target: 'g20' },
        { source: 'uae', target: 'g20' },
        { source: 'eu', target: 'g20' },
        { source: 'in', target: 'jebel_ali' },
        { source: 'uae', target: 'jebel_ali' },
        { source: 'sa', target: 'jebel_ali' },
        { source: 'sa', target: 'haifa' },
        { source: 'il', target: 'haifa' },
        { source: 'haifa', target: 'piraeus' },
        { source: 'eu', target: 'piraeus' },
        { source: 'cn', target: 'piraeus', label: 'Ownership' },
        { source: 'cn', target: 'geoecon' },
        { source: 'us', target: 'geoecon' },
        { source: 'tr', target: 'drp' },
        { source: 'ir', target: 'drp' },
        { source: 'ir', target: 'instc' },
        { source: 'in', target: 'instc' },
        { source: 'blue_raman', target: 'in' },
        { source: 'blue_raman', target: 'il' },
        { source: 'blue_raman', target: 'eu' },
        { source: 'abraham', target: 'il' },
        { source: 'abraham', target: 'uae' },
        { source: 'abraham', target: 'us' },
        { source: 'gaza_war', target: 'il' },
        { source: 'gaza_war', target: 'red_sea' },
        { source: 'red_sea', target: 'suez' },
        { source: 'suez', target: 'redundancy' },
        { source: 'redundancy', target: 'haifa' },
        { source: 'multipolarity', target: 'in' },
        { source: 'multipolarity', target: 'sa' },
        { source: 'multipolarity', target: 'uae' },
    ]
};

// Map type to icons
const getTypeIcon = (type: NodeType) => {
    switch (type) {
        case 'Actor': return Network;
        case 'Infrastructure': return Anchor;
        case 'Event': return AlertTriangle;
        case 'Concept': return Lightbulb;
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
                        {['All', 'Actor', 'Infrastructure', 'Event', 'Concept'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setActiveFilter(type as any)}
                                className={`px-3 py-1 text-xs rounded-full border transition-all ${activeFilter === type
                                    ? 'bg-zinc-200 text-black border-zinc-200 font-medium'
                                    : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
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
                                {selectedNode.details.map((detail, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <span className="text-xs text-zinc-500 font-medium">{detail.key}</span>
                                        <span className="text-sm text-zinc-200 bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.05]">
                                            {detail.value}
                                        </span>
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
