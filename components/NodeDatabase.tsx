/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import * as d3 from 'd3';

/* ─────────────────────────────────────────────
   COLOR SYSTEM — Institutional Academic Aesthetic
   ───────────────────────────────────────────── */

const TYPE_COLORS: Record<string, string> = {
    Actor: '#ffffff',
    Framework: '#b0b0b0',
    Logistics: '#ffffff',
    Digital: '#ffffff',
    Energy: '#166534',
    Shock: '#ea580c',
    Rival: '#991b1b',
};

const CORRIDOR_COLORS: Record<string, string> = {
    'IMEC': '#2C3E50', // Slate Blue
    'BRI': '#4A1F1F', // Muted Oxblood
    'INSTC': '#3D4B3D', // Desaturated Sage
    'DEFAULT': '#444444' // Neutral Grey for non-corridor links
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
    coord?: string; // e.g. "25.00° N, 55.05° E"
    watermark?: string; // e.g. "I N D I A"
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

interface LinkData extends d3.SimulationLinkDatum<NodeData> {
    weight: number;
    corridor: 'IMEC' | 'BRI' | 'INSTC' | 'DEFAULT';
}

const initialData: { nodes: NodeData[]; links: LinkData[] } = {
    nodes: [
        { id: "usa", type: "Actor", val: 7, color: TYPE_COLORS.Actor, label: "United States", desc: "Strategic backer of IMEC via PGII to counter China's BRI." },
        { id: "india", type: "Actor", val: 7, color: TYPE_COLORS.Actor, label: "India", desc: "Anchor economy leveraging IMEC to bypass Pakistan.", watermark: "I N D I A" },
        { id: "eu", type: "Actor", val: 6, color: TYPE_COLORS.Actor, label: "European Union", desc: "Aligning IMEC with its €300B Global Gateway fund.", watermark: "E U R O P E A N  U N I O N" },
        { id: "ksa", type: "Actor", val: 6, color: TYPE_COLORS.Actor, label: "Saudi Arabia", desc: "Crucial land bridge connecting the Gulf to the Levant.", watermark: "S A U D I  A R A B I A" },
        { id: "uae", type: "Actor", val: 6, color: TYPE_COLORS.Actor, label: "UAE", desc: "Pioneering the logistics network and funding Jordanian rails.", watermark: "U A E" },
        { id: "israel", type: "Actor", val: 5, color: TYPE_COLORS.Actor, label: "Israel", desc: "The Mediterranean anchor point; provides overland redundancy.", watermark: "I S R A E L" },
        { id: "greece", type: "Actor", val: 5, color: TYPE_COLORS.Actor, label: "Greece", desc: "Maritime entry point to the European Union.", watermark: "G R E E C E" },
        { id: "china", type: "Actor", val: 7, color: TYPE_COLORS.Actor, label: "China", desc: "Architect of the $8 Trillion BRI. Views IMEC as containment.", watermark: "C H I N A" },
        { id: "iraq", type: "Actor", val: 5, color: TYPE_COLORS.Actor, label: "Iraq", desc: "Driving the $17B Development Road as an alternative.", watermark: "I R A Q" },

        { id: "mumbai", type: "Logistics", val: 6, color: TYPE_COLORS.Logistics, label: "MUMBAI (JNPT)", desc: "Primary maritime exit node on India's west coast.", coord: "18.95° N, 72.95° E" },
        { id: "jebel_ali", type: "Logistics", val: 6, color: TYPE_COLORS.Logistics, label: "JEBEL ALI", desc: "The largest port in the Middle East.", coord: "25.00° N, 55.05° E" },
        { id: "fujairah", type: "Logistics", val: 5, color: TYPE_COLORS.Logistics, label: "FUJAIRAH", desc: "Key bunkering and transshipment hub bypassing Hormuz.", coord: "25.12° N, 56.32° E" },
        { id: "haifa", type: "Logistics", val: 6, color: TYPE_COLORS.Logistics, label: "HAIFA PORT", desc: "Critical Mediterranean gateway, acquired by Adani.", coord: "32.81° N, 35.00° E" },
        { id: "piraeus", type: "Logistics", val: 6, color: TYPE_COLORS.Logistics, label: "PIRAEUS", desc: "Major European entry, controlled by COSCO.", coord: "37.94° N, 23.64° E" },

        { id: "abraham_accords", type: "Framework", val: 5, color: TYPE_COLORS.Framework, label: "Abraham Accords", desc: "Geopolitical normalization underpinning the overland routes." },
        { id: "i2u2", type: "Framework", val: 4, color: TYPE_COLORS.Framework, label: "I2U2 Group", desc: "India, Israel, UAE, and US partnership." },

        { id: "blue_raman", type: "Digital", val: 5, color: TYPE_COLORS.Digital, label: "Blue-Raman Cable", desc: "218 Tbps Google subsea fiber bypassing Egypt." },
        { id: "neom_h2", type: "Energy", val: 5, color: TYPE_COLORS.Energy, label: "NEOM Green Hydrogen", desc: "$8.4B Saudi green ammonia project." },

        { id: "gaza_war", type: "Shock", val: 7, color: TYPE_COLORS.Shock, label: "Gaza War", desc: "Systemic shock stalling normalization." },
        { id: "red_sea", type: "Shock", val: 6, color: TYPE_COLORS.Shock, label: "Red Sea Crisis", desc: "Houthi attacks paralyzing Suez shipping." },

        { id: "bri", type: "Rival", val: 6, color: TYPE_COLORS.Rival, label: "Belt & Road", desc: "China's $8T global infrastructure project." },
        { id: "drp", type: "Rival", val: 4, color: TYPE_COLORS.Rival, label: "Development Road", desc: "$17B Iraq-Turkey rail bypass." },
        { id: "instc_route", type: "Rival", val: 4, color: TYPE_COLORS.Rival, label: "INSTC Network", desc: "International North-South Transport Corridor." },
    ],
    links: [
        // IMEC Backbone
        { source: "mumbai", target: "jebel_ali", weight: 5, corridor: "IMEC" },
        { source: "jebel_ali", target: "fujairah", weight: 4, corridor: "IMEC" },
        { source: "jebel_ali", target: "ksa", weight: 5, corridor: "IMEC" },
        { source: "fujairah", target: "ksa", weight: 4, corridor: "IMEC" },
        { source: "ksa", target: "israel", weight: 5, corridor: "IMEC" },
        { source: "ksa", target: "neom_h2", weight: 4, corridor: "IMEC" },
        { source: "israel", target: "haifa", weight: 5, corridor: "IMEC" },
        { source: "haifa", target: "piraeus", weight: 5, corridor: "IMEC" },
        { source: "piraeus", target: "greece", weight: 5, corridor: "IMEC" },
        { source: "eu", target: "greece", weight: 5, corridor: "IMEC" },
        { source: "usa", target: "india", weight: 5, corridor: "IMEC" },
        { source: "usa", target: "uae", weight: 4, corridor: "IMEC" },
        { source: "india", target: "i2u2", weight: 4, corridor: "IMEC" },
        { source: "i2u2", target: "abraham_accords", weight: 4, corridor: "IMEC" },
        { source: "abraham_accords", target: "israel", weight: 4, corridor: "IMEC" },
        { source: "haifa", target: "blue_raman", weight: 4, corridor: "IMEC" },

        // BRI Axis
        { source: "china", target: "bri", weight: 5, corridor: "BRI" },
        { source: "bri", target: "piraeus", weight: 4, corridor: "BRI" },
        { source: "iraq", target: "drp", weight: 4, corridor: "BRI" },
        { source: "china", target: "drp", weight: 3, corridor: "BRI" },

        // INSTC Axis
        { source: "india", target: "instc_route", weight: 4, corridor: "INSTC" },

        // Default / Shocks
        { source: "gaza_war", target: "abraham_accords", weight: 5, corridor: "DEFAULT" },
        { source: "gaza_war", target: "red_sea", weight: 5, corridor: "DEFAULT" },
        { source: "red_sea", target: "jebel_ali", weight: 4, corridor: "DEFAULT" },
    ]
};

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

type FilterType = 'ALL' | 'IMEC' | 'BRI' | 'GEOPOLITICAL';

export default function NodeDatabase() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [threshold, setThreshold] = useState<number>(1);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const resetZoomRef = useRef<() => void>(() => { });

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
        let activeLinks = initialData.links.filter(l => l.weight >= threshold);

        if (activeFilter === 'IMEC') {
            activeLinks = activeLinks.filter(l => l.corridor === 'IMEC' || l.corridor === 'DEFAULT');
        } else if (activeFilter === 'BRI') {
            activeLinks = activeLinks.filter(l => l.corridor === 'BRI' || l.corridor === 'INSTC' || l.corridor === 'DEFAULT');
        }

        const validIds = new Set<string>();
        activeLinks.forEach(l => {
            validIds.add(typeof l.source === 'object' ? (l.source as any).id : l.source);
            validIds.add(typeof l.target === 'object' ? (l.target as any).id : l.target);
        });

        // Always show all nodes or just nodes with valid links?
        let activeNodes = initialData.nodes.filter(n => validIds.has(n.id) || activeFilter === 'ALL');

        if (activeFilter === 'GEOPOLITICAL') {
            activeNodes = initialData.nodes.filter(n => n.type === 'Actor' || n.type === 'Shock' || n.type === 'Rival');
            validIds.clear();
            activeNodes.forEach(n => validIds.add(n.id));
            activeLinks = initialData.links.filter(l => {
                const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                return validIds.has(s) && validIds.has(t) && l.weight >= threshold;
            });
        }

        return {
            nodes: activeNodes.map(n => ({ ...n })) as NodeData[],
            links: activeLinks.map(l => ({ ...l })) as LinkData[]
        };
    }, [activeFilter, threshold]);

    // Calculate neighbors globally once for the dossier
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
            .force('link', d3.forceLink<NodeData, LinkData>(filteredData.links).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-800))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('x', d3.forceX(width / 2).strength(0.04))
            .force('y', d3.forceY(height / 2).strength(0.04))
            .force('collision', d3.forceCollide<NodeData>().radius(d => d.val * 5 + 20))
            .alphaDecay(0.08);

        // Watermarks Layer (rendered first so it stays in background)
        const watermarkGroup = zoomGroup.append('g').attr('class', 'watermark-group');

        // Links
        const link = zoomGroup.append('g')
            .selectAll('line')
            .data(filteredData.links)
            .join('line')
            .attr('stroke', d => CORRIDOR_COLORS[d.corridor] || '#333333')
            .attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '4, 2')
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

        // Geometric Crosshair
        renderNodes.append('path')
            .attr('d', d => {
                const s = Math.max(4, d.val * 0.8);
                return `M -${s} 0 L ${s} 0 M 0 -${s} L 0 ${s}`;
            })
            .attr('stroke', d => d.type === 'Logistics' ? '#ffffff' : d.color)
            .attr('stroke-width', 1)
            .attr('fill', 'none');

        // Tag Background
        const labelGroup = renderNodes.append('g')
            .attr('class', 'label-group')
            // only highest priority visible initially
            .attr('opacity', d => d.val >= 6 ? 1 : 0);

        // Compute text width approximation for the sharp rectangle
        const estCharWidth = 6.8;

        labelGroup.append('rect')
            .attr('x', d => -(d.label.length * estCharWidth) / 2 - 8)
            .attr('y', 10)
            .attr('width', d => d.label.length * estCharWidth + 16)
            .attr('height', 20)
            .attr('fill', '#000000')
            .attr('stroke', d => d.color)
            .attr('stroke-width', 0.5)
            .attr('shape-rendering', 'crispEdges');

        // Data Label (Mono)
        labelGroup.append('text')
            .text(d => d.type === 'Logistics' ? d.label.toUpperCase() : d.label)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-family', '"IBM Plex Mono", "JetBrains Mono", monospace')
            .style('font-size', '10px')
            .attr('dy', 24)
            .style('pointer-events', 'none')
            .attr('text-transform', d => d.type === 'Logistics' ? 'uppercase' : 'none');

        // Coordinates Label (Visible if zoomed & has coordinates)
        const coordsGroup = labelGroup.append('g').attr('class', 'coords-grp').attr('opacity', 0);
        coordsGroup.append('text')
            .text(d => d.coord || '')
            .attr('text-anchor', 'middle')
            .attr('fill', '#888888')
            .attr('font-family', '"IBM Plex Mono", "JetBrains Mono", monospace')
            .style('font-size', '6px')
            .attr('dy', 38)
            .style('pointer-events', 'none');

        // Zoom/Pan
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.6, 10])
            .on("zoom", (e) => {
                zoomGroup.attr("transform", e.transform);

                // Smart Zoom Thresholding
                const k = e.transform.k;
                renderNodes.selectAll('.label-group').attr('opacity', (d: any) => d.val >= 6 || k >= 1.5 ? 1 : 0);
                renderNodes.selectAll('.coords-grp').attr('opacity', (d: any) => (d.coord && k >= 2.0) ? 1 : 0);

                // Enforce sharp zoom line thickness
                link.attr('stroke-width', 0.5 / k);
            });

        svg.call(zoom);
        svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.9).translate(-width / 2, -height / 2));

        resetZoomRef.current = () => {
            svg.transition().duration(750)
                .call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.9).translate(-width / 2, -height / 2));
        };

        function applySpotlight(activeId: string | null) {
            if (!activeId) {
                renderNodes.attr('opacity', 1);
                link.attr('opacity', 1).attr('stroke', (d: any) => CORRIDOR_COLORS[d.corridor] || '#333333');
                return;
            }

            const activeNeighbors = neighbors.get(activeId) || new Set();

            renderNodes.attr('opacity', (n) =>
                n.id === activeId || activeNeighbors.has(n.id) ? 1 : 0.05
            );

            link.attr('opacity', (l: any) => {
                const sId = typeof l.source === 'object' ? l.source.id : l.source;
                const tId = typeof l.target === 'object' ? l.target.id : l.target;
                return (sId === activeId || tId === activeId) ? 1 : 0.05;
            }).attr('stroke', (l: any) => {
                const sId = typeof l.source === 'object' ? l.source.id : l.source;
                const tId = typeof l.target === 'object' ? l.target.id : l.target;
                return (sId === activeId || tId === activeId) ? '#ffffff' : (CORRIDOR_COLORS[l.corridor] || '#333333');
            });
        }

        let currentHoverId: string | null = null;
        let currentSelectId: string | null = selectedNode ? selectedNode.id : null;

        const updateVisuals = () => {
            const activeId = currentSelectId || currentHoverId;
            applySpotlight(activeId);

            renderNodes.selectAll('.label-group').attr('opacity', function (d: any) {
                const isHovered = currentHoverId && (d.id === currentHoverId || neighbors.get(currentHoverId)?.has(d.id));
                const isSelected = currentSelectId && (d.id === currentSelectId || neighbors.get(currentSelectId)?.has(d.id));
                // Get zoom property
                const tz = d3.zoomTransform(svg.node() as Element).k;
                if (d.val >= 6 || tz >= 1.5 || isHovered || isSelected) return 1;
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

        svg.on('click', () => {
            currentSelectId = null;
            setSelectedNode(null);
            updateVisuals();
        });

        // Initialize Watermark DOM elements based on filter
        const nodesWithWatermarks = filteredData.nodes.filter(n => n.watermark);
        const watermarkText = watermarkGroup.selectAll('text')
            .data(nodesWithWatermarks, (d: any) => d.id)
            .join('text')
            .text(d => d.watermark!)
            .attr('font-family', '"Fraunces", "Libre Baskerville", serif')
            .attr('font-size', '4rem')
            .attr('letter-spacing', '0.2em')
            .attr('fill', '#ffffff')
            .attr('opacity', 0.15)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('pointer-events', 'none');

        // Tick loop
        simulation.on('tick', () => {
            const padding = 20;
            filteredData.nodes.forEach(d => {
                const radius = d.val * 5 + padding;
                d.x = Math.max(radius, Math.min(width - radius, d.x!));
                d.y = Math.max(radius, Math.min(height - radius, d.y!));
            });

            link
                .attr('x1', (d) => (d.source as NodeData).x!)
                .attr('y1', (d) => (d.source as NodeData).y!)
                .attr('x2', (d) => (d.target as NodeData).x!)
                .attr('y2', (d) => (d.target as NodeData).y!);

            renderNodes.attr('transform', (d) => `translate(${d.x},${d.y})`);

            // Position watermarks based on their parent node
            watermarkText
                .attr('x', (d: any) => d.x)
                .attr('y', (d: any) => d.y);
        });

        updateVisuals();

        // Fast forward
        for (let i = 0; i < 60; ++i) simulation.tick();

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
                <h1 className="text-2xl font-bold tracking-tight text-white leading-none font-serif" style={{ letterSpacing: '-0.02em' }}>
                    IMEC Strategic Architecture
                </h1>
                <p className="text-[11px] tracking-[0.3em] text-white/40 uppercase mt-1 font-mono">
                    Geospatial Intelligence · Academic Overview
                </p>
            </div>

            {/* ── FILTER TAXONOMY (Bottom Left) ── */}
            <div className="absolute bottom-8 left-8 z-40 pointer-events-auto flex flex-col gap-4">
                <div className="flex gap-0">
                    {(['ALL', 'IMEC', 'BRI', 'GEOPOLITICAL'] as FilterType[]).map(f => (
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
                            Link Density Threshold
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
                    Corridor Lexicon
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {Object.entries(CORRIDOR_COLORS).filter(([k]) => k !== 'DEFAULT').map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                            <span className="w-4 h-px" style={{ backgroundColor: color }} />
                            <span className="text-[10px] tracking-wider text-white/80 font-mono uppercase">
                                {type}
                            </span>
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/80 font-mono">
                            +
                        </span>
                        <span className="text-[10px] tracking-wider text-white/60 font-mono uppercase">
                            Target Node
                        </span>
                    </div>
                </div>
            </div>

            {/* ── RESET VIEW BUTTON ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
                <button
                    onClick={() => resetZoomRef.current()}
                    className="border border-white/20 bg-black text-white hover:bg-white hover:text-black transition-colors px-6 py-2.5 text-[11px] tracking-[0.2em] font-mono uppercase cursor-pointer flex items-center justify-center"
                    style={{ borderRadius: 0 }}
                >
                    [ RESET CARTOGRAPHY ]
                </button>
            </div>

            {/* ── CANVAS / SVG ── */}
            <svg ref={svgRef} className="w-full h-full cursor-move" />

            {/* ── DOSSIER PANEL (Right) ── */}
            {
                selectedNode && (
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
                                <span className="text-[10px] font-black" style={{ color: selectedNode.color, fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace' }}>
                                    +
                                </span>
                                <span className="text-[10px] tracking-[0.3em] uppercase font-mono"
                                    style={{ color: selectedNode.color }}>
                                    {selectedNode.type}
                                </span>
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl font-bold text-white leading-tight mb-2 font-serif" style={{ letterSpacing: '-0.02em' }}>
                                {selectedNode.label}
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
                                    {selectedNode.desc}
                                </p>
                            </div>

                            {/* Metrics */}
                            <div className="border border-white/20 mb-8 bg-black" style={{ borderRadius: 0 }}>
                                <div className="flex">
                                    <div className="flex-1 px-4 py-3 border-r border-white/20">
                                        <div className="text-[9px] tracking-[0.2em] text-white/30 uppercase font-mono">
                                            Density Val
                                        </div>
                                        <div className="text-xl text-white font-bold mt-1 font-mono">
                                            {selectedNode.val}
                                        </div>
                                    </div>
                                    <div className="flex-1 px-4 py-3">
                                        <div className="text-[9px] tracking-[0.2em] text-white/30 uppercase font-mono">
                                            Links
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
                                    Vector Dependencies
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
                                                    <span className="text-[12px] font-black" style={{ color: n.color, fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace' }}>
                                                        +
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
                )
            }
        </div >
    );
}
