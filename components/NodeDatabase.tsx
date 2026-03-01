/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import * as d3 from 'd3';

/* ─────────────────────────────────────────────
   COLOR SYSTEM — Editorial Brutalism
   No purple, no indigo, no violet, no soft blue.
   ───────────────────────────────────────────── */

const TYPE_COLORS: Record<string, string> = {
    Actor: '#ffffff',
    Framework: '#ffffff',
    Logistics: '#ffffff',
    Digital: '#ffffff',
    Energy: '#166534',
    Shock: '#ea580c',
    Rival: '#991b1b',
};

// FontAwesome Unicode mappings
const TYPE_ICONS: Record<string, string> = {
    Actor: '\uf19c', // Landmark
    Framework: '\uf02d', // Book / Document
    Logistics: '\uf13d', // Anchor
    Digital: '\uf233', // Server
    Energy: '\uf0e7', // Lightning Bolt
    Shock: '\uf071', // Alert Triangle
    Rival: '\uf05b', // Crosshairs or target
};

/* ─────────────────────────────────────────────
   DATASET
   ───────────────────────────────────────────── */

type NodeType = 'Actor' | 'Framework' | 'Logistics' | 'Digital' | 'Energy' | 'Shock' | 'Rival';

interface NodeData extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    type: NodeType;
    val: number;
    color: string;
    desc: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

interface LinkData extends d3.SimulationLinkDatum<NodeData> {
    weight: number;
}

const initialData: { nodes: NodeData[]; links: LinkData[] } = {
    nodes: [
        { id: "usa", type: "Actor", val: 7, color: TYPE_COLORS.Actor, label: "United States", desc: "Strategic backer of IMEC via PGII to counter China's BRI." },
        { id: "india", type: "Actor", val: 7, color: TYPE_COLORS.Actor, label: "India", desc: "Anchor economy leveraging IMEC to bypass Pakistan." },
        { id: "eu", type: "Actor", val: 6, color: TYPE_COLORS.Actor, label: "European Union", desc: "Aligning IMEC with its €300B Global Gateway fund." },
        { id: "ksa", type: "Actor", val: 6, color: TYPE_COLORS.Actor, label: "Saudi Arabia", desc: "Crucial land bridge connecting the Gulf to the Levant." },
        { id: "uae", type: "Actor", val: 6, color: TYPE_COLORS.Actor, label: "UAE", desc: "Pioneering the logistics network and funding Jordanian rails." },
        { id: "israel", type: "Actor", val: 5, color: TYPE_COLORS.Actor, label: "Israel", desc: "The Mediterranean anchor point; provides overland redundancy." },
        { id: "china", type: "Actor", val: 7, color: TYPE_COLORS.Actor, label: "China", desc: "Architect of the $8 Trillion BRI. Views IMEC as containment." },
        { id: "palantir", type: "Actor", val: 5, color: TYPE_COLORS.Actor, label: "Palantir Foundry", desc: "Military/intelligence data integration platform." },
        { id: "scaleai", type: "Actor", val: 4, color: TYPE_COLORS.Actor, label: "ScaleAI", desc: "Data labeling for autonomous defense systems." },
        { id: "elbit", type: "Actor", val: 4, color: TYPE_COLORS.Actor, label: "Elbit Systems", desc: "Defense contractor providing physical security infrastructure." },

        { id: "abraham_accords", type: "Framework", val: 5, color: TYPE_COLORS.Framework, label: "Abraham Accords", desc: "Geopolitical normalization underpinning the overland routes." },
        { id: "pgii", type: "Framework", val: 3, color: TYPE_COLORS.Framework, label: "G7 PGII", desc: "Partnership for Global Infrastructure and Investment." },
        { id: "global_gateway", type: "Framework", val: 3, color: TYPE_COLORS.Framework, label: "EU Global Gateway", desc: "EU strategy to mobilize investments." },
        { id: "i2u2", type: "Framework", val: 4, color: TYPE_COLORS.Framework, label: "I2U2 Group", desc: "India, Israel, UAE, and US partnership." },
        { id: "imec_announce", type: "Framework", val: 6, color: TYPE_COLORS.Framework, label: "IMEC Declaration", desc: "Formal announcement at G20 New Delhi." },
        { id: "ai_dss", type: "Framework", val: 4, color: TYPE_COLORS.Framework, label: "AI-DSS Protocol", desc: "Automated Decision Support Systems." },

        { id: "vadhavan", type: "Logistics", val: 4, color: TYPE_COLORS.Logistics, label: "Vadhavan Port", desc: "Upcoming $9B Indian mega-port." },
        { id: "jebel_ali", type: "Logistics", val: 5, color: TYPE_COLORS.Logistics, label: "Jebel Ali Port", desc: "The largest port in the Middle East." },
        { id: "al_ghuwaifat", type: "Logistics", val: 2, color: TYPE_COLORS.Logistics, label: "Al-Ghuwaifat", desc: "UAE-Saudi rail border crossing." },
        { id: "al_haditha", type: "Logistics", val: 2, color: TYPE_COLORS.Logistics, label: "Al-Haditha Hub", desc: "Saudi-Jordanian border transshipment." },
        { id: "mafraq", type: "Logistics", val: 3, color: TYPE_COLORS.Logistics, label: "Mafraq", desc: "Jordanian logistical hub." },
        { id: "beit_shean", type: "Logistics", val: 3, color: TYPE_COLORS.Logistics, label: "Beit She'an", desc: "Rail junction connecting Jordan to Israel." },
        { id: "haifa", type: "Logistics", val: 6, color: TYPE_COLORS.Logistics, label: "Haifa Port", desc: "Critical Mediterranean gateway, acquired by Adani." },
        { id: "piraeus", type: "Logistics", val: 4, color: TYPE_COLORS.Logistics, label: "Piraeus Port", desc: "Major European entry, controlled by COSCO." },
        { id: "marseille", type: "Logistics", val: 3, color: TYPE_COLORS.Logistics, label: "Marseille", desc: "Key European terminus for shipping and cables." },
        { id: "ben_gurion_canal", type: "Logistics", val: 4, color: TYPE_COLORS.Logistics, label: "Ben Gurion Canal", desc: "Theoretical Israeli alternative to Suez." },

        { id: "blue_raman", type: "Digital", val: 5, color: TYPE_COLORS.Digital, label: "Blue-Raman Cable", desc: "218 Tbps Google subsea fiber bypassing Egypt." },
        { id: "teas", type: "Digital", val: 4, color: TYPE_COLORS.Digital, label: "TEAS Network", desc: "Trans Europe Asia System." },
        { id: "data_centers", type: "Digital", val: 4, color: TYPE_COLORS.Digital, label: "Gulf Data Centers", desc: "High-compute nodes in UAE/KSA." },
        { id: "project_nimbus", type: "Digital", val: 5, color: TYPE_COLORS.Digital, label: "Project Nimbus", desc: "$1.2B cloud project by Google/Amazon." },
        { id: "lavender", type: "Digital", val: 4, color: TYPE_COLORS.Digital, label: "Lavender AI", desc: "Automated targeting system." },
        { id: "peace_cable", type: "Digital", val: 4, color: TYPE_COLORS.Digital, label: "PEACE Cable", desc: "Chinese-backed digital backbone." },

        { id: "neom_h2", type: "Energy", val: 4, color: TYPE_COLORS.Energy, label: "NEOM Hydrogen", desc: "$8.4B Saudi green ammonia project." },
        { id: "hvdc", type: "Energy", val: 4, color: TYPE_COLORS.Energy, label: "UAE-India HVDC", desc: "Proposed subsea power cable." },

        { id: "gaza_war", type: "Shock", val: 7, color: TYPE_COLORS.Shock, label: "Gaza War", desc: "Systemic shock stalling normalization." },
        { id: "red_sea", type: "Shock", val: 6, color: TYPE_COLORS.Shock, label: "Red Sea Crisis", desc: "Houthi attacks paralyzing Suez shipping." },
        { id: "suez", type: "Shock", val: 5, color: TYPE_COLORS.Shock, label: "Suez Vulnerability", desc: "Historical maritime bottleneck." },
        { id: "auto_target", type: "Shock", val: 4, color: TYPE_COLORS.Shock, label: "AI Target Bleed", desc: "Lethal targeting without human loops." },

        { id: "bri", type: "Rival", val: 6, color: TYPE_COLORS.Rival, label: "Belt & Road", desc: "China's $8T global infrastructure project." },
        { id: "drp", type: "Rival", val: 4, color: TYPE_COLORS.Rival, label: "Development Road", desc: "$17B Iraq-Turkey rail bypass." },
    ],
    links: [
        { source: "israel", target: "abraham_accords", weight: 5 },
        { source: "uae", target: "abraham_accords", weight: 5 },
        { source: "abraham_accords", target: "i2u2", weight: 4 },
        { source: "india", target: "i2u2", weight: 4 },
        { source: "i2u2", target: "imec_announce", weight: 5 },
        { source: "eu", target: "imec_announce", weight: 4 },
        { source: "haifa", target: "blue_raman", weight: 3 },
        { source: "jebel_ali", target: "data_centers", weight: 3 },
        { source: "ksa", target: "neom_h2", weight: 3 },
        { source: "vadhavan", target: "jebel_ali", weight: 4 },
        { source: "jebel_ali", target: "al_ghuwaifat", weight: 4 },
        { source: "al_ghuwaifat", target: "al_haditha", weight: 3 },
        { source: "al_haditha", target: "mafraq", weight: 3 },
        { source: "mafraq", target: "beit_shean", weight: 3 },
        { source: "beit_shean", target: "haifa", weight: 4 },
        { source: "haifa", target: "piraeus", weight: 4 },
        { source: "piraeus", target: "marseille", weight: 3 },
        { source: "usa", target: "palantir", weight: 4 },
        { source: "israel", target: "elbit", weight: 3 },
        { source: "palantir", target: "ai_dss", weight: 4 },
        { source: "scaleai", target: "ai_dss", weight: 3 },
        { source: "ai_dss", target: "lavender", weight: 5 },
        { source: "usa", target: "project_nimbus", weight: 5 },
        { source: "project_nimbus", target: "israel", weight: 5 },
        { source: "project_nimbus", target: "lavender", weight: 4 },
        { source: "lavender", target: "auto_target", weight: 5 },
        { source: "project_nimbus", target: "data_centers", weight: 3 },
        { source: "gaza_war", target: "abraham_accords", weight: 5 },
        { source: "gaza_war", target: "red_sea", weight: 5 },
        { source: "red_sea", target: "suez", weight: 5 },
        { source: "china", target: "bri", weight: 5 },
        { source: "china", target: "peace_cable", weight: 4 },
        { source: "bri", target: "drp", weight: 4 },
        { source: "suez", target: "ben_gurion_canal", weight: 3 },
    ]
};

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

type FilterType = 'ALL' | 'INFRASTRUCTURE' | 'DIGITAL' | 'GEOPOLITICAL';

export default function NodeDatabase() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [threshold, setThreshold] = useState<number>(1);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Internal state references for D3 hover
    // Internal state references for D3 hover

    // Handle Resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Filter data based on activeFilter and threshold
    const filteredData = useMemo(() => {
        let activeNodes = initialData.nodes;
        if (activeFilter === 'INFRASTRUCTURE') {
            activeNodes = activeNodes.filter(n => n.type === 'Logistics' || n.type === 'Energy');
        } else if (activeFilter === 'DIGITAL') {
            activeNodes = activeNodes.filter(n => n.type === 'Digital');
        } else if (activeFilter === 'GEOPOLITICAL') {
            activeNodes = activeNodes.filter(n => n.type === 'Actor' || n.type === 'Framework' || n.type === 'Shock' || n.type === 'Rival');
        }

        const nodeIds = new Set(activeNodes.map(n => n.id));
        const activeLinks = initialData.links.filter(l => {
            const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return nodeIds.has(s) && nodeIds.has(t) && l.weight >= threshold;
        });

        // Cloning nodes so D3 simulation doesn't mutate our original data constantly on filter change
        return {
            nodes: activeNodes.map(n => ({ ...n })) as NodeData[],
            links: activeLinks.map(l => ({ ...l })) as LinkData[]
        };
    }, [activeFilter, threshold]);

    // Calculate neighbors globally once for the dossier (independent of filter)
    const neighbors = useMemo(() => {
        const map = new Map<string, Set<string>>();
        initialData.links.forEach(link => {
            const s = typeof link.source === 'object' ? (link.source as any).id : link.source;
            const t = typeof link.target === 'object' ? (link.target as any).id : link.target;
            if (!map.has(s)) map.set(s, new Set());
            if (!map.has(t)) map.set(t, new Set());
            map.get(s)!.add(t);
            map.get(t)!.add(s);
        });
        return map;
    }, []);

    // Build the D3 Graph
    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

        const svg = d3.select(svgRef.current);
        const { width, height } = dimensions;

        // Cleanup before re-render
        svg.selectAll('*').remove();

        const zoomGroup = svg.append('g').attr('class', 'content');

        // Setup physics simulation
        const simulation = d3.forceSimulation<NodeData>(filteredData.nodes)
            .force('link', d3.forceLink<NodeData, LinkData>(filteredData.links).id(d => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<NodeData>().radius(d => d.val * 3.5 + 10));

        // Links
        const link = zoomGroup.append('g')
            .selectAll('line')
            .data(filteredData.links)
            .join('line')
            .attr('stroke', '#333333')
            .attr('stroke-width', 1)
            .attr('class', 'graph-link transition-opacity duration-300');

        // Node Groups
        const renderNodes = zoomGroup.append('g')
            .selectAll('g')
            .data(filteredData.nodes)
            .join('g')
            .attr('class', 'graph-node transition-opacity duration-300 cursor-pointer')
            .call(d3.drag<any, NodeData>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                })
            );

        // Solid node circle (no border, no glow)
        renderNodes.append('circle')
            .attr('r', d => d.val * 3)
            .attr('fill', '#000000') // Solid black background circle
            .attr('stroke', 'transparent')
            .attr('stroke-width', 0);

        // FontAwesome icon as text
        renderNodes.append('text')
            .attr('class', 'icon')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-family', '"Font Awesome 5 Free", "Font Awesome 5 Brands"')
            .attr('font-weight', 900)
            .style('font-size', d => `${d.val * 2.8}px`)
            .attr('fill', d => d.color)
            .text(d => TYPE_ICONS[d.type] || '\uf111');

        // Data Label
        renderNodes.append('text')
            .attr('class', 'label')
            .text(d => d.label)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-family', '"JetBrains Mono", Courier, monospace')
            .style('font-size', '11px')
            .attr('dy', d => d.val * 3 + 12)
            .style('pointer-events', 'none')
            // Only show labels for highest value initially
            .attr('opacity', d => d.val >= 6 ? 1 : 0);

        // Zoom/Pan
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (e) => {
                zoomGroup.attr("transform", e.transform);
                renderNodes.selectAll('.label').attr('opacity', (d: any) => d.val >= 6 || e.transform.k >= 1.5 ? 1 : 0);
            });

        svg.call(zoom);
        svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.9).translate(-width / 2, -height / 2));

        // Spotlight Function
        function applySpotlight(activeId: string | null) {
            if (!activeId) {
                renderNodes.attr('opacity', 1).attr('filter', null);
                link.attr('opacity', 1).attr('stroke', '#333333');
                return;
            }

            const activeNeighbors = neighbors.get(activeId) || new Set();

            renderNodes.attr('opacity', (n) =>
                n.id === activeId || activeNeighbors.has(n.id) ? 1 : 0.05
            );

            link.attr('opacity', (l) => {
                const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
                return (sId === activeId || tId === activeId) ? 1 : 0.05;
            }).attr('stroke', (l) => {
                const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
                return (sId === activeId || tId === activeId) ? '#ffffff' : '#333333';
            });
        }

        // Apply interaction manually via d3.select instead of React state loops to avoid re-mounting simulation
        let currentHoverId: string | null = null;
        let currentSelectId: string | null = selectedNode ? selectedNode.id : null;

        const updateVisuals = () => {
            const activeId = currentSelectId || currentHoverId;
            applySpotlight(activeId);

            // Labels logic
            renderNodes.selectAll('.label').attr('opacity', function (d: any) {
                if (d.val >= 6) return 1;
                if (currentSelectId && (d.id === currentSelectId || neighbors.get(currentSelectId)?.has(d.id))) return 1;
                if (currentHoverId && (d.id === currentHoverId || neighbors.get(currentHoverId)?.has(d.id))) return 1;
                return 0;
            });
        };

        renderNodes.on('mouseover', function (_, d) {
            currentHoverId = d.id;
            updateVisuals();
        }).on('mouseout', function () {
            currentHoverId = null;
            updateVisuals();
        }).on('click', function (event, d) {
            event.stopPropagation();
            currentSelectId = d.id;
            setSelectedNode(d as NodeData);
            updateVisuals();
        });

        // Background click clears selection
        svg.on('click', () => {
            currentSelectId = null;
            setSelectedNode(null);
            updateVisuals();
        });

        // Tick loop
        simulation.on('tick', () => {
            link
                .attr('x1', (d) => (d.source as NodeData).x!)
                .attr('y1', (d) => (d.source as NodeData).y!)
                .attr('x2', (d) => (d.target as NodeData).x!)
                .attr('y2', (d) => (d.target as NodeData).y!);

            renderNodes.attr('transform', (d) => `translate(${d.x},${d.y})`);
        });

        updateVisuals();

        // Fast forward 50 ticks to stop initial wobbly rendering
        for (let i = 0; i < 50; ++i) simulation.tick();

        return () => {
            simulation.stop();
            svg.selectAll('*').remove();
        };
    }, [dimensions, filteredData, neighbors, selectedNode]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-10 w-full h-full bg-black overflow-hidden font-serif">

            {/* ── HEADER ── */}
            <div className="absolute top-0 left-0 z-40 border-b border-white/20 px-8 py-5 pointer-events-auto mt-16 bg-black"
                style={{ borderRadius: 0 }}>
                <h1 className="text-2xl font-bold tracking-tight text-white leading-none font-serif">
                    IMEC Strategic Architecture
                </h1>
                <p className="text-[11px] tracking-[0.3em] text-white/40 uppercase mt-1 font-mono">
                    Infrastructure & Intelligence Mapping · PhD Defense
                </p>
            </div>

            {/* ── FILTER TAXONOMY (Bottom Left) ── */}
            <div className="absolute bottom-8 left-8 z-40 pointer-events-auto flex flex-col gap-4">
                <div className="flex gap-0">
                    {(['ALL', 'INFRASTRUCTURE', 'DIGITAL', 'GEOPOLITICAL'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-colors font-mono cursor-pointer border border-transparent ${activeFilter === f
                                ? 'bg-white text-black border-white'
                                : 'bg-black text-white/50 border-white/20 hover:text-white hover:border-white/60'
                                }`}
                            style={{ borderRadius: 0 }}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* ── THRESHOLD SLIDER ── */}
                <div className="border border-white/20 bg-black px-4 py-3" style={{ borderRadius: 0 }}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-mono">
                            Connection Threshold
                        </span>
                        <span className="text-[12px] text-white font-bold font-mono">
                            ≥ {threshold}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between mt-1">
                        {[1, 2, 3, 4, 5].map(v => (
                            <span key={v} className="text-[8px] text-white/30 font-mono">
                                {v}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── LEGEND (Bottom Right) ── */}
            <div className="absolute bottom-8 right-8 z-40 border border-white/20 bg-black px-5 py-4 pointer-events-auto"
                style={{ borderRadius: 0 }}>
                <div className="text-[9px] tracking-[0.2em] text-white/40 uppercase mb-3 font-mono">
                    Node Taxonomy
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(TYPE_COLORS).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                            <span className="text-[11px] font-black" style={{ color: color, fontFamily: '"Font Awesome 5 Free", "Font Awesome 5 Brands"' }}>
                                {TYPE_ICONS[type] || '\uf111'}
                            </span>
                            <span className="text-[10px] text-white/60 font-mono">
                                {type}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CANVAS / SVG ── */}
            <svg ref={svgRef} className="w-full h-full cursor-move" />

            {/* ── DOSSIER PANEL (Right) ── */}
            {selectedNode && (
                <div className="absolute right-0 top-0 w-[400px] h-screen bg-black border-l border-white/20 z-40 overflow-y-auto pointer-events-auto"
                    style={{ borderRadius: 0 }}>

                    <div className="px-8 pt-24 pb-8">
                        {/* Close */}
                        <button onClick={() => setSelectedNode(null)}
                            className="absolute top-20 right-6 text-white/30 hover:text-white transition-colors cursor-pointer">
                            <X className="w-5 h-5" strokeWidth={1} />
                        </button>

                        {/* Type Badge */}
                        <div className="inline-flex items-center gap-2 border border-white/20 px-3 py-1 mb-4 bg-black"
                            style={{ borderRadius: 0 }}>
                            <span className="text-[10px] font-black" style={{ color: selectedNode.color, fontFamily: '"Font Awesome 5 Free", "Font Awesome 5 Brands"' }}>
                                {TYPE_ICONS[selectedNode.type] || '\uf111'}
                            </span>
                            <span className="text-[10px] tracking-[0.3em] uppercase font-mono"
                                style={{ color: selectedNode.color }}>
                                {selectedNode.type}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold tracking-tight text-white leading-tight mb-6 font-serif">
                            {selectedNode.label}
                        </h2>

                        {/* Divider */}
                        <div className="w-full h-px bg-white/20 mb-6" />

                        {/* Desc */}
                        <div className="mb-8">
                            <div className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-2 font-mono">
                                Intelligence Brief
                            </div>
                            <p className="text-[14px] text-white/70 leading-relaxed font-serif">
                                {selectedNode.desc}
                            </p>
                        </div>

                        {/* Metrics */}
                        <div className="border border-white/20 mb-8 bg-black" style={{ borderRadius: 0 }}>
                            <div className="flex">
                                <div className="flex-1 px-4 py-3 border-r border-white/20">
                                    <div className="text-[9px] tracking-[0.2em] text-white/30 uppercase font-mono">
                                        Weight
                                    </div>
                                    <div className="text-xl text-white font-bold mt-1 font-mono">
                                        {selectedNode.val}
                                    </div>
                                </div>
                                <div className="flex-1 px-4 py-3">
                                    <div className="text-[9px] tracking-[0.2em] text-white/30 uppercase font-mono">
                                        Connections
                                    </div>
                                    <div className="text-xl text-white font-bold mt-1 font-mono">
                                        {neighbors.get(selectedNode.id)?.size || 0}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Neighbors */}
                        <div>
                            <div className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-3 font-mono">
                                Direct Dependencies
                            </div>
                            <div className="flex flex-col gap-0 border-t border-white/20">
                                {Array.from(neighbors.get(selectedNode.id) || []).map(nId => {
                                    const n = initialData.nodes.find(nd => nd.id === nId);
                                    if (!n) return null;
                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => setSelectedNode(n as NodeData)}
                                            className="flex items-center justify-between px-4 py-3 border-b border-x border-white/20 bg-black hover:bg-white/5 transition-colors text-left cursor-pointer"
                                            style={{ borderRadius: 0, marginTop: -1 }}
                                        >
                                            <span className="text-[13px] text-white font-serif flex items-center gap-3">
                                                <span className="text-[12px] font-black" style={{ color: n.color, fontFamily: '"Font Awesome 5 Free", "Font Awesome 5 Brands"' }}>
                                                    {TYPE_ICONS[n.type] || '\uf111'}
                                                </span>
                                                {n.label}
                                            </span>
                                            <span className="text-[9px] tracking-[0.2em] uppercase font-mono"
                                                style={{ color: n.color }}>
                                                {n.type}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
