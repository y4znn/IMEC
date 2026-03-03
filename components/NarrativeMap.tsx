'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATA STRUCTURES ---

interface NodeData {
    id: string; // ISO A3 code
    name: string;
    role: string;
    description: string;
    next: string | null; // ISO A3 of next node
    lat: number;
    lng: number;
}

const imecNodes: NodeData[] = [
    { id: "IND", name: "India", role: "The Eastern Anchor", description: "Primary manufacturing and export terminus. Connects to the Middle East via JNPT and Mundra ports.", next: "ARE", lat: 20.5937, lng: 78.9629 },
    { id: "ARE", name: "United Arab Emirates", role: "The Gulf Transshipment Hub", description: "Jebel Ali and Fujairah serve as the core maritime-to-rail transshipment zone, bypassing the Strait of Hormuz.", next: "SAU", lat: 23.4241, lng: 53.8478 },
    { id: "SAU", name: "Saudi Arabia", role: "The Desert Land-Bridge", description: "Vast overland railway integration connecting the Persian Gulf to the Jordanian border.", next: "JOR", lat: 23.8859, lng: 45.0792 },
    { id: "JOR", name: "Jordan", role: "The Vital Transit", description: "Critical connective tissue bridging Saudi rail lines to Israeli seaports.", next: "ISR", lat: 30.5852, lng: 35.2332 },
    { id: "ISR", name: "Israel", role: "The Mediterranean Hinge", description: "Haifa port acts as the final exit point before entering European waters.", next: "GRC", lat: 31.0461, lng: 34.8516 },
    { id: "GRC", name: "Greece", role: "The European Entry", description: "Piraeus port serves as the immediate geographic gateway into the EU market.", next: "ITA", lat: 39.0742, lng: 21.8243 },
    { id: "ITA", name: "Italy", role: "The Central Artery", description: "Core Mediterranean distribution hub for continental supply chains.", next: "FRA", lat: 41.8719, lng: 12.5674 },
    { id: "FRA", name: "France", role: "The Western Terminus", description: "Marseille acts as the final strategic locus for Western European integration.", next: null, lat: 46.2276, lng: 2.2137 }
];

const imecCountryIds = imecNodes.map(n => n.id);

export default function NarrativeMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const d3ContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current || !d3ContainerRef.current) return;
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Clear previous renders
        d3.select(d3ContainerRef.current).selectAll("*").remove();

        const svg = d3.select(d3ContainerRef.current)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("position", "absolute")
            .style("top", 0)
            .style("left", 0)
            .style("z-index", 1) // Ensure it sits above background but can capture events
            .style("cursor", "crosshair");

        const g = svg.append("g");

        // Set up zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Natural Earth projection mapping to Eurasia + Africa roughly
        const projection = d3.geoNaturalEarth1()
            .scale(width / 3.5)
            .translate([width / 2.2, height / 1.7])
            .center([40, 25]); // Rough center roughly over middle east

        const path = d3.geoPath().projection(projection);

        let topologyData: TopoJSON.Topology | null = null;

        const renderMap = () => {
            if (!topologyData) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const geojson = topojson.feature(topologyData, (topologyData.objects.countries) as any) as any;

            // Render all countries
            const countryPaths = g.selectAll("path.country")
                .data(geojson.features)
                .join("path")
                .attr("class", "country")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .attr("d", path as any)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .attr("id", (d: any) => `country-${d.id}`)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .style("fill", (d: any) => imecCountryIds.includes(d.id) ? "#D1D5DB" : "transparent") // IMEC resting grey, Ghost transparent
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .style("stroke", (d: any) => imecCountryIds.includes(d.id) ? "#9CA3AF" : "#E5E7EB") // Ghost borders faintly structured
                .style("stroke-width", "0.5px")
                .style("transition", "fill 0.4s ease-out, stroke 0.4s ease-out")
                // Make sure bounding box is clickable using visiblePainted or all, transparent strokes don't block
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .style("pointer-events", (d: any) => imecCountryIds.includes(d.id) ? "all" : "none") // Only register hover on IMEC bounds
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .on("mouseenter", (_event: MouseEvent, d: any) => {
                    if (imecCountryIds.includes(d.id)) {
                        setHoveredNode(d.id);
                    }
                })
                .on("mousemove", (event: MouseEvent) => {
                    setMousePos({ x: event.clientX, y: event.clientY });
                })
                .on("mouseleave", () => {
                    setHoveredNode(null);
                });

            // Recreate nodes selection
            const nodeSelection = g.selectAll("circle.node")
                .data(imecNodes)
                .join("circle")
                .attr("class", "node")
                .attr("cx", d => projection([d.lng, d.lat])?.[0] || 0)
                .attr("cy", d => projection([d.lng, d.lat])?.[1] || 0)
                .attr("r", 5) // Increased hit area mapping
                .style("fill", "#111827")
                // Allow pointer events on dots so user can hover over cities directly
                .style("pointer-events", "all")
                .style("cursor", "pointer")
                .style("opacity", 0.5)
                .style("transition", "all 0.3s ease")
                .on("mouseenter", (_event: MouseEvent, d) => {
                    setHoveredNode((d as NodeData).id);
                })
                .on("mousemove", (event: MouseEvent) => {
                    setMousePos({ x: event.clientX, y: event.clientY });
                })
                .on("mouseleave", () => {
                    setHoveredNode(null);
                });

            // Expose a method to update the state imperatively bypassing React reconciler overhead for D3 layers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d3ContainerRef.current as any)._updateD3Visuals = (hoveredId: string | null) => {
                let nextId: string | null = null;
                if (hoveredId) {
                    const node = imecNodes.find(n => n.id === hoveredId);
                    nextId = node?.next || null;
                }

                // Update map fills (Domino logic)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                countryPaths.style("fill", (d: any) => {
                    if (!imecCountryIds.includes(d.id)) return "transparent"; // Keep ghost world transparent
                    if (!hoveredId) return "#D1D5DB"; // Default state
                    if (d.id === hoveredId) return "#111827"; // Deep Charcoal
                    if (d.id === nextId) return "#3B82F6"; // Pulses to Slate Blue
                    return "#F3F4F6"; // Fade everything else
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }).style("stroke", (d: any) => {
                    // Minor border tweaks when active
                    if (!imecCountryIds.includes(d.id)) return "#E5E7EB";
                    if (!hoveredId) return "#9CA3AF";
                    if (d.id === hoveredId) return "#1F2937";
                    if (d.id === nextId) return "#60A5FA";
                    return "#F3F4F6";
                });

                // Update map points
                nodeSelection
                    .style("opacity", d => {
                        if (!hoveredId) return 0.5;
                        if (d.id === hoveredId || d.id === nextId) return 1;
                        return 0.1;
                    })
                    .style("fill", d => d.id === nextId ? "#3B82F6" : "#111827")
                    .attr("r", d => d.id === hoveredId || d.id === nextId ? 5 : 3);

                // Draw / Remove Connections
                g.selectAll("path.connection").remove();

                if (hoveredId && nextId) {
                    const start = imecNodes.find(n => n.id === hoveredId);
                    const end = imecNodes.find(n => n.id === nextId);

                    if (start && end) {
                        const p1 = projection([start.lng, start.lat]);
                        const p2 = projection([end.lng, end.lat]);

                        if (p1 && p2) {
                            // SVG Curved Path
                            const dx = p2[0] - p1[0];
                            const dy = p2[1] - p1[1];
                            const dr = Math.sqrt(dx * dx + dy * dy);
                            const sweep = start.lng > end.lng ? 1 : 0;
                            const pathData = `M ${p1[0]},${p1[1]} A ${dr * 0.8},${dr * 0.8} 0 0,${sweep} ${p2[0]},${p2[1]}`;
                            const connection = g.append("path")
                                .attr("class", "connection")
                                .attr("d", pathData)
                                .style("fill", "none")
                                .style("stroke", "#3B82F6")
                                .style("stroke-width", "2px")
                                .style("pointer-events", "none");

                            // CSS transition trick to draw line
                            const len = (connection.node() as SVGPathElement).getTotalLength();
                            connection
                                .attr("stroke-dasharray", len + " " + len)
                                .attr("stroke-dashoffset", len)
                                .transition()
                                .duration(600)
                                .ease(d3.easeCubicOut)
                                .attr("stroke-dashoffset", 0);
                        }
                    }
                }
            };
        };

        const fetchTopology = async () => {
            try {
                // Pre-fetch geometries from CDN (standard topology map source)
                const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
                topologyData = await res.json();
                renderMap();
            } catch (err) {
                console.error("Failed to load map data", err);
            }
        };

        fetchTopology();

        // Responsive handler to redraw everything when window size changes
        const resizeObserver = new ResizeObserver(() => {
            if (!containerRef.current) return;
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;
            projection.scale(newWidth / 3.5).translate([newWidth / 2.2, newHeight / 1.7]);

            // Re-map all element coordinates
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            g.selectAll("path.country").attr("d", path as any);
            g.selectAll("circle.node")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .attr("cx", (d: any) => projection([d.lng, d.lat])?.[0] || 0)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .attr("cy", (d: any) => projection([d.lng, d.lat])?.[1] || 0);

            // Hide connections for a second to let layout settle
            g.selectAll("path.connection").remove();
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Call D3 internal update synchronously with React state
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (d3ContainerRef.current && (d3ContainerRef.current as any)._updateD3Visuals) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d3ContainerRef.current as any)._updateD3Visuals(hoveredNode);
        }
    }, [hoveredNode]);

    const activeNode = hoveredNode ? imecNodes.find(n => n.id === hoveredNode) : null;
    const nextNode = activeNode?.next ? imecNodes.find(n => n.id === activeNode.next) : null;

    return (
        <div ref={containerRef} className="w-full h-full relative" style={{ overflow: 'hidden' }}>
            {/* The SVG element is injected via D3 into this container element natively */}
            <div ref={d3ContainerRef} className="absolute inset-0" />

            <AnimatePresence>
                {activeNode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed pointer-events-none z-50 bg-white border border-gray-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] w-[320px]"
                        style={{
                            left: `${mousePos.x + 24}px`,
                            top: `${mousePos.y + 24}px`,
                            borderRadius: 0, // Strict Bento Box format
                        }}
                    >
                        <div className="p-6">
                            <div className="flex flex-col mb-4 bg-gray-50/50 p-2 border border-gray-100">
                                <span className="text-[10px] text-gray-500 font-mono tracking-[0.2em] uppercase">Active Corridor Node // {activeNode.id}</span>
                            </div>

                            <h3
                                className="text-2xl text-gray-900 font-bold leading-tight mb-2"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}
                            >
                                {activeNode.name}
                            </h3>

                            <div className="w-8 h-px bg-gray-900 mb-4" />

                            <div className="mb-4">
                                <div className="text-[11px] font-mono text-gray-900 uppercase tracking-widest mb-1.5 font-bold">
                                    {activeNode.role}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed font-serif">
                                    {activeNode.description}
                                </p>
                            </div>

                            {nextNode && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-mono text-blue-500 tracking-widest uppercase mb-1">Direct Connectivity To</span>
                                        <span className="text-xs font-mono text-blue-700 font-bold uppercase tracking-wider">{nextNode.name}</span>
                                    </div>
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-50 text-blue-500 rounded-full">
                                        <span className="font-mono text-[10px] transform md:rotate-0 -rotate-45">→</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Informational overlay to act as a legend for D3 layout */}
            <div className="absolute bottom-8 right-8 z-20 pointer-events-none bg-white/90 backdrop-blur-md border border-gray-200 p-5" style={{ borderRadius: 0 }}>
                <h3 className="text-gray-900 text-[10px] tracking-[0.2em] font-mono uppercase mb-3 text-right">Interactive Topology</h3>
                <div className="flex items-center gap-3 justify-end mb-2">
                    <span className="text-[10px] text-gray-500 font-serif italic">Hover to isolate sector logic</span>
                    <div className="w-[6px] h-[6px] rounded-full bg-gray-900"></div>
                </div>
            </div>
        </div>
    );
}
