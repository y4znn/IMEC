'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, ChevronUp, ChevronDown } from 'lucide-react';

// --- DATA STRUCTURES ---

export type Pillar = 'TRANSPORT' | 'DIGITAL' | 'ENERGY';

interface NodeData {
    id: string; // ISO A3 code
    name: string;
    role: string;
    description: string;
    next: string | null; // ISO A3 of next node
    lat: number;
    lng: number;
    type: 'Sea' | 'Land'; // Context for transport routing
    infrastructureInvestment: number; // In billions
    dossierIntelligence: string; // Detail for side panel
}

const imecNodes: NodeData[] = [
    { id: "IND", name: "India", role: "The Eastern Anchor", description: "Primary manufacturing and export terminus. Connects to the Middle East via JNPT and Mundra ports.", next: "OMN", lat: 20.5937, lng: 78.9629, type: 'Sea', infrastructureInvestment: 10, dossierIntelligence: "Eastern Anchor. $10B national port modernization strategy deployed for hubs like Mundra and Vadhavan." },
    { id: "OMN", name: "Oman", role: "Strategic Bypass", description: "Strategic landing point for the Blue-Raman subsea cable and Hafeet Rail project bypassing traditional bottlenecks.", next: "ARE", lat: 21.4735, lng: 55.9754, type: 'Land', infrastructureInvestment: 2, dossierIntelligence: "Strategic Bypass: The Hafeet Rail project links Sohar port to the UAE, offering a critical supply chain redundancy that bypasses the Strait of Hormuz." },
    { id: "ARE", name: "United Arab Emirates", role: "The Gulf Transshipment Hub", description: "Jebel Ali and Fujairah serve as the core maritime-to-rail transshipment zone, bypassing the Strait of Hormuz.", next: "SAU", lat: 23.4241, lng: 53.8478, type: 'Land', infrastructureInvestment: 8, dossierIntelligence: "Integration point for GCC grids. Key maritime-to-rail switchyard." },
    { id: "SAU", name: "Saudi Arabia", role: "The Desert Land-Bridge", description: "Vast overland railway integration connecting the Persian Gulf to the Jordanian border.", next: "JOR", lat: 23.8859, lng: 45.0792, type: 'Land', infrastructureInvestment: 20, dossierIntelligence: "Integration of the Saudi East Cargo Train; requires 269km of missing rail links from Al-Ghuwaifat (UAE) to Haradh." },
    { id: "JOR", name: "Jordan", role: "The Vital Transit", description: "Critical connective tissue bridging Saudi rail lines to Israeli seaports.", next: "ISR", lat: 30.5852, lng: 35.2332, type: 'Land', infrastructureInvestment: 5, dossierIntelligence: "Crucial Bottleneck. Requires $2.09B - $2.6B to build a 225km standard-gauge freight rail linking Al-Haditha to the Israeli border." },
    { id: "ISR", name: "Israel", role: "The Mediterranean Hinge", description: "Haifa port acts as the final exit point before entering European waters.", next: "GRC", lat: 31.0461, lng: 34.8516, type: 'Sea', infrastructureInvestment: 6, dossierIntelligence: "Haifa Port Modernization. Terrestrial fusion point for the Blue-Raman data cable bypassing Egypt." },
    { id: "GRC", name: "Greece", role: "The European Entry", description: "Piraeus port serves as the immediate geographic gateway into the EU market.", next: "ITA", lat: 39.0742, lng: 21.8243, type: 'Sea', infrastructureInvestment: 4, dossierIntelligence: "European entry point distributing energy and digital payloads deep into the EU." },
    { id: "ITA", name: "Italy", role: "The Central Artery", description: "Core Mediterranean distribution hub for continental supply chains.", next: "FRA", lat: 41.8719, lng: 12.5674, type: 'Land', infrastructureInvestment: 5, dossierIntelligence: "Continental supply chain distributor for Western Europe." },
    { id: "FRA", name: "France", role: "The Western Terminus", description: "Marseille acts as the final strategic locus for Western European integration.", next: null, lat: 46.2276, lng: 2.2137, type: 'Land', infrastructureInvestment: 4, dossierIntelligence: "Western terminus concluding the Blue-Raman route." }
];

const imecCountryIds = imecNodes.map(n => n.id);

const chokepoints = [
    { id: "SUEZ", name: "Suez Canal", lat: 30.5852, lng: 32.2654, description: "Strategic Vulnerability: Houthi threats have reduced Suez Canal container crossings by 90%, necessitating the IMEC overland bypass." },
    { id: "BAM", name: "Bab el-Mandeb", lat: 12.5833, lng: 43.3333, description: "Strategic Vulnerability: Critical Red Sea access point entirely compromised by asymmetrical warfare, shutting off the Eastern Mediterranean from Asia." }
];

export default function NarrativeMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const d3ContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [activePillar, setActivePillar] = useState<Pillar>('TRANSPORT');
    const [isLegendOpen, setIsLegendOpen] = useState(true);
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
            .wheelDelta((event) => -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002))
            .on("zoom", (event) => {
                g.attr("transform", event.transform);

                // CRITICAL: Semantic scaling (keep elements crisp and thin regardless of zoom)
                g.selectAll("path.country").style("stroke-width", 0.5 / event.transform.k + "px");
                g.selectAll("path.connection").style("stroke-width", function () {
                    const baseWidth = parseFloat(d3.select(this).attr("data-basewidth") || "2");
                    return (baseWidth / event.transform.k) + "px";
                });
                g.selectAll("g.node-group").attr("transform", (d) => {
                    const node = d as NodeData;
                    const [x, y] = projection([node.lng, node.lat]) || [0, 0];
                    return `translate(${x}, ${y}) scale(${1 / event.transform.k})`;
                });
                g.selectAll("g.chokepoint-group").attr("transform", (d) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const point = d as any;
                    const [x, y] = projection([point.lng, point.lat]) || [0, 0];
                    return `translate(${x}, y) scale(${1 / event.transform.k})`;
                });
            });

        svg.call(zoom);

        // Expose a method to reset zoom smoothly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d3ContainerRef.current as any)._resetZoom = () => {
            svg.transition()
                .duration(750)
                .ease(d3.easeCubicInOut)
                .call(zoom.transform, d3.zoomIdentity);
        };

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

            // Setup Choropleth Scale
            const maxInvestment = d3.max(imecNodes, d => d.infrastructureInvestment) || 20;
            // Map 0 to maxInvestment to a slate color range, darkest for highest investment
            const colorScale = d3.scaleLinear<string>()
                .domain([0, maxInvestment])
                .range(["#E5E7EB", "#374151"]); // light gray to deep slate

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
                .style("fill", (d: any) => {
                    if (imecCountryIds.includes(d.id)) {
                        const node = imecNodes.find(n => n.id === d.id);
                        return node ? colorScale(node.infrastructureInvestment) : "#D1D5DB";
                    }
                    return "#F9FAFB";
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .style("stroke", (d: any) => imecCountryIds.includes(d.id) ? "#6B7280" : "#9CA3AF") // Darker strokes for visibility
                .style("stroke-width", "1px")
                .style("transition", "fill 0.4s ease-out, stroke 0.4s ease-out")
                // Make sure bounding box is clickable using visiblePainted or all, transparent strokes don't block
                .style("pointer-events", "none"); // Disable direct country pointer events to let Voronoi catch SVG mouse events

            // Recreate nodes selection as groups
            const nodeSelection = g.selectAll("g.node-group")
                .data(imecNodes)
                .join("g")
                .attr("class", "node-group")
                .attr("transform", d => {
                    const [x, y] = projection([d.lng, d.lat]) || [0, 0];
                    // At start zoom k=1 so scale=1
                    return `translate(${x}, ${y}) scale(1)`;
                })
                .style("opacity", 0.5)
                .style("transition", "opacity 0.3s ease")
                .style("pointer-events", "none");

            // Pulse ring background
            nodeSelection.selectAll("circle.pulse")
                .data(d => [d])
                .join("circle")
                .attr("class", "pulse")
                .attr("r", 5)
                .style("fill", "transparent");

            // Node background circle
            nodeSelection.selectAll("circle.node-bg")
                .data(d => [d])
                .join("circle")
                .attr("class", "node-bg")
                .attr("r", 9)
                .style("fill", "#111827")
                .style("stroke", "#ffffff")
                .style("stroke-width", "1.5px");

            // High-Fidelity SVG Iconography
            const anchorPath = "M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
            const trainPath = "M4 11h16M12 3v8m-4 8-2 3m10-3-2-3M8 15h0m8 0h0M6 3h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z";

            nodeSelection.selectAll("path.icon")
                .data(d => [d])
                .join("path")
                .attr("class", "icon")
                .attr("d", d => {
                    const id = (d as NodeData).id;
                    if (id === 'OMN') return "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"; // Smartphone/Server stub
                    return ["IND", "ARE", "ISR", "GRC", "ITA", "FRA"].includes(id) ? anchorPath : trainPath
                })
                .style("fill", "none")
                .style("stroke", "#ffffff")
                .style("stroke-width", "2.5px") // Thicker for better readability
                .style("stroke-linecap", "round")
                .style("stroke-linejoin", "round")
                .attr("transform", "translate(-6, -6) scale(0.5)"); // Center 24x24 icons

            // Render Chokepoints
            const chokepointSelection = g.selectAll("g.chokepoint-group")
                .data(chokepoints)
                .join("g")
                .attr("class", "chokepoint-group")
                .attr("transform", d => {
                    const [x, y] = projection([d.lng, d.lat]) || [0, 0];
                    return `translate(${x}, ${y}) scale(1)`;
                })
                .style("pointer-events", "all")
                // In a multi-pillar map, show only on TRANSPORT or perhaps always to emphasize geopolitics
                .style("opacity", 1);

            chokepointSelection.selectAll("circle.cp-pulse")
                .data(d => [d])
                .join("circle")
                .attr("class", "cp-pulse")
                .attr("r", 4)
                .style("fill", "#EF4444")
                .style("opacity", 0.5)
                .style("pointer-events", "none");

            chokepointSelection.selectAll("circle.cp-core")
                .data(d => [d])
                .join("circle")
                .attr("class", "cp-core")
                .attr("r", 3)
                .style("fill", "#B91C1C")
                .style("stroke", "#ffffff")
                .style("stroke-width", "1px");

            chokepointSelection.selectAll("title")
                .data(d => [d])
                .join("title")
                .text(d => d.description);

            // Animate Chokepoints continuously
            const animateChokepoints = () => {
                chokepointSelection.selectAll("circle.cp-pulse")
                    .attr("r", 4)
                    .style("opacity", 0.8)
                    .transition()
                    .duration(2000)
                    .ease(d3.easeCircleOut)
                    .attr("r", 15)
                    .style("opacity", 0)
                    .on("end", animateChokepoints);
            };
            animateChokepoints();

            // Semantic Voronoi overlay for magnetic hover detection
            const voronoiPoints: [number, number][] = imecNodes.map(d => {
                const p = projection([d.lng, d.lat]);
                return p ? [p[0], p[1]] : [0, 0];
            });
            const delaunay = d3.Delaunay.from(voronoiPoints);

            // Re-bind mouse handlers safely capturing current state logic requirements although state is kept mostly out of D3
            // We use a small hack by attaching a click handler to an invisible overlay to avoid re-binding issues with state
            svg.on("mousemove", (event) => {
                // Get pointer position inside 'g' which inherently considers the zoom transform
                const [x, y] = d3.pointer(event, g.node());
                const index = delaunay.find(x, y);

                if (index !== undefined) {
                    const node = imecNodes[index];
                    const [nx, ny] = projection([node.lng, node.lat]) || [0, 0];
                    const distance = Math.hypot(x - nx, y - ny);

                    // Magnetic snapping threshold (80px in projected map coordinates)
                    if (distance < 80) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        if ((d3ContainerRef.current as any)._currentHoveredId !== node.id) {
                            setHoveredNode(node.id);
                        }
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        if ((d3ContainerRef.current as any)._currentHoveredId !== null) {
                            setHoveredNode(null);
                        }
                    }
                }
                setMousePos({ x: event.clientX, y: event.clientY });
            });

            svg.on("mouseleave", () => {
                setHoveredNode(null);
            });

            svg.on("click", (event) => {
                const [x, y] = d3.pointer(event, g.node());
                const index = delaunay.find(x, y);
                if (index !== undefined) {
                    const node = imecNodes[index];
                    const [nx, ny] = projection([node.lng, node.lat]) || [0, 0];
                    const distance = Math.hypot(x - nx, y - ny);
                    if (distance < 80) {
                        setSelectedNode(node.id);
                    }
                }
            });

            // Radar pulse animation logic
            const pulseLoop = (targetId: string) => {
                const pulseNode = nodeSelection.selectAll("circle.pulse").filter((d) => (d as NodeData).id === targetId);
                function repeat() {
                    pulseNode
                        .attr("r", 9)
                        .style("opacity", 1)
                        .style("stroke", "#3B82F6")
                        .style("stroke-width", "2px")
                        .transition()
                        .duration(1500)
                        .ease(d3.easeCubicOut)
                        .attr("r", 32)
                        .style("opacity", 0)
                        .on("end", () => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            if ((d3ContainerRef.current as any)._currentNextId === targetId) {
                                repeat();
                            }
                        });
                }
                repeat();
            };

            // Expose a method to update the state imperatively bypassing React reconciler overhead for D3 layers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d3ContainerRef.current as any)._currentHoveredId = null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d3ContainerRef.current as any)._currentNextId = null;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d3ContainerRef.current as any)._updateD3Visuals = (hoveredId: string | null, pillar: Pillar) => {
                let nextId: string | null = null;
                if (hoveredId && pillar === 'TRANSPORT') {
                    const node = imecNodes.find(n => n.id === hoveredId);
                    nextId = node?.next || null;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (d3ContainerRef.current as any)._currentHoveredId = hoveredId;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (d3ContainerRef.current as any)._currentNextId = nextId;

                // Update map fills (Domino logic)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                countryPaths.style("fill", (d: any) => {
                    if (!imecCountryIds.includes(d.id)) return "#F9FAFB";
                    if (!hoveredId) {
                        const node = imecNodes.find(n => n.id === d.id);
                        return node ? colorScale(node.infrastructureInvestment) : "#D1D5DB";
                    }
                    if (d.id === hoveredId) return "#111827"; // Deep Charcoal
                    if (d.id === nextId) return "#3B82F6"; // Pulses to Slate Blue
                    return "#F3F4F6"; // Fade everything else
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }).style("stroke", (d: any) => {
                    // Minor border tweaks when active
                    if (!imecCountryIds.includes(d.id)) return "#9CA3AF";
                    if (!hoveredId) return "#6B7280";
                    if (d.id === hoveredId) return "#1F2937";
                    if (d.id === nextId) return "#60A5FA";
                    return "#F3F4F6";
                });

                // Update map points
                nodeSelection
                    .style("opacity", (d) => {
                        const node = d as NodeData;

                        if (!hoveredId) return 0.5;
                        if (node.id === hoveredId || node.id === nextId) return 1;
                        return 0.1;
                    });

                nodeSelection.selectAll("circle.node-bg")
                    .style("fill", (d) => (d as NodeData).id === nextId ? "#3B82F6" : "#111827")
                    .attr("r", (d) => (d as NodeData).id === hoveredId || (d as NodeData).id === nextId ? 11 : 9);

                // Setup pulse
                nodeSelection.selectAll("circle.pulse").interrupt();
                nodeSelection.selectAll("circle.pulse")
                    .style("opacity", 0)
                    .attr("r", 5);

                if (nextId && pillar === 'TRANSPORT') {
                    pulseLoop(nextId);
                }

                // Smoothly fade out old connections
                g.selectAll("path.connection")
                    .transition()
                    .duration(300)
                    .style("opacity", 0)
                    .remove();

                const drawConnection = (startId: string, endId: string, type: 'TRANSPORT_SEA' | 'TRANSPORT_LAND' | 'DIGITAL' | 'ENERGY') => {
                    const start = imecNodes.find(n => n.id === startId);
                    const end = imecNodes.find(n => n.id === endId);

                    if (start && end) {
                        const p1 = projection([start.lng, start.lat]);
                        const p2 = projection([end.lng, end.lat]);

                        if (p1 && p2) {
                            const dx = p2[0] - p1[0];
                            const dy = p2[1] - p1[1];
                            const dr = Math.sqrt(dx * dx + dy * dy);

                            // Sweeping Bezier arcs mimicking real shipping lanes and routes
                            let sweep = start.lng > end.lng ? 1 : 0;
                            const arcScale = 0.8;

                            // Adjusting sweep flags for elegant curvatures
                            if (type === 'DIGITAL') sweep = 0;
                            if (type === 'ENERGY') sweep = 1;

                            const pathData = `M ${p1[0]},${p1[1]} A ${dr * arcScale},${dr * arcScale} 0 0,${sweep} ${p2[0]},${p2[1]}`;

                            let haloColor = "";
                            let coreColor = "";
                            let haloWidth = 6;
                            let coreWidth = 2;
                            let coreDashArray = "none";
                            let haloOpacity = 0.15;

                            if (type === 'TRANSPORT_SEA') {
                                haloColor = "#3B82F6";
                                coreColor = "#3B82F6";
                                haloOpacity = 0.15;
                                coreWidth = 1.5;
                                coreDashArray = "4, 4";
                            } else if (type === 'TRANSPORT_LAND') {
                                haloColor = "#E11D48";
                                coreColor = "#111827"; // deep charcoal
                                haloOpacity = 0.1;
                                coreWidth = 2;
                            } else if (type === 'DIGITAL') {
                                haloColor = "#A855F7"; // Purple for digital
                                coreColor = "#A855F7";
                                haloOpacity = 0.15;
                                coreWidth = 1.5;
                                coreDashArray = "4, 4";
                            } else if (type === 'ENERGY') {
                                haloColor = "#10B981"; // Bright Green for energy
                                coreColor = "#10B981";
                                haloOpacity = 0.15;
                                coreWidth = 1.5;
                            }

                            const currentTransform = d3.zoomTransform(svg.node() as Element);
                            const k = currentTransform.k;

                            // Render Halo layer immediately without transition
                            g.append("path")
                                .attr("class", "connection")
                                .attr("data-basewidth", haloWidth)
                                .attr("d", pathData)
                                .style("fill", "none")
                                .style("stroke", haloColor)
                                .style("stroke-width", (haloWidth / k) + "px")
                                .style("opacity", haloOpacity)
                                .style("stroke-linecap", "round")
                                .style("pointer-events", "none");

                            // Render Core layer immediately without transition
                            g.append("path")
                                .attr("class", "connection")
                                .attr("data-basewidth", coreWidth)
                                .attr("d", pathData)
                                .style("fill", "none")
                                .style("stroke", coreColor)
                                .style("stroke-dasharray", coreDashArray)
                                .style("stroke-width", (coreWidth / k) + "px")
                                .style("opacity", 1)
                                .style("stroke-linecap", "round")
                                .style("pointer-events", "none");
                        }
                    }
                };

                // Draw / Remove Connections based on Pillar
                if (pillar === 'TRANSPORT') {
                    if (hoveredId && nextId) {
                        const start = imecNodes.find(n => n.id === hoveredId);
                        if (start) {
                            const type = start.type === 'Sea' ? 'TRANSPORT_SEA' : 'TRANSPORT_LAND';
                            drawConnection(hoveredId, nextId, type);
                        }
                    }
                } else if (pillar === 'DIGITAL') {
                    // Draw Blue-Raman static route
                    drawConnection("IND", "OMN", "DIGITAL");
                    drawConnection("OMN", "SAU", "DIGITAL");
                    drawConnection("SAU", "JOR", "DIGITAL");
                    drawConnection("JOR", "ISR", "DIGITAL");
                    drawConnection("ISR", "GRC", "DIGITAL");
                    drawConnection("GRC", "ITA", "DIGITAL");
                    drawConnection("ITA", "FRA", "DIGITAL");
                } else if (pillar === 'ENERGY') {
                    // Draw Energy routes (NEOM & GCC)
                    drawConnection("SAU", "JOR", "ENERGY"); // Hydrogen pipeline to Med
                    drawConnection("JOR", "ISR", "ENERGY");
                    drawConnection("SAU", "ARE", "ENERGY"); // GCC Grid
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

            g.selectAll("g.node-group").attr("transform", (d) => {
                const node = d as NodeData;
                const currentTransform = d3.zoomTransform(svg.node() as Element);
                const [x, y] = projection([node.lng, node.lat]) || [0, 0];
                return `translate(${x}, ${y}) scale(${1 / currentTransform.k})`;
            });

            g.selectAll("g.chokepoint-group").attr("transform", (d) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const point = d as any;
                const currentTransform = d3.zoomTransform(svg.node() as Element);
                const [x, y] = projection([point.lng, point.lat]) || [0, 0];
                return `translate(${x}, ${y}) scale(${1 / currentTransform.k})`;
            });

            // Re-trigger state to redraw connections on resize
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (d3ContainerRef.current && (d3ContainerRef.current as any)._updateD3Visuals) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (d3ContainerRef.current as any)._updateD3Visuals((d3ContainerRef.current as any)._currentHoveredId, (d3ContainerRef.current as any)._currentPillar || 'TRANSPORT');
            }
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
            (d3ContainerRef.current as any)._currentPillar = activePillar;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d3ContainerRef.current as any)._updateD3Visuals(hoveredNode, activePillar);
        }
    }, [hoveredNode, activePillar]);

    const activeNodeData = hoveredNode ? imecNodes.find(n => n.id === hoveredNode) : null;
    const nextNodeData = activeNodeData?.next ? imecNodes.find(n => n.id === activeNodeData.next) : null;
    const selectedNodeData = selectedNode ? imecNodes.find(n => n.id === selectedNode) : null;

    return (
        <div ref={containerRef} className="w-full h-full relative" style={{ overflow: 'hidden' }}>
            {/* The SVG element is injected via D3 into this container element natively */}
            <div ref={d3ContainerRef} className="absolute inset-0" />

            <AnimatePresence>
                {activeNodeData && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed pointer-events-none z-50 bg-white border border-gray-200 shadow-xl w-[320px] rounded-none"
                        style={{
                            left: `${mousePos.x + 24}px`,
                            top: `${mousePos.y + 24}px`,
                            transition: 'left 0.15s ease-out, top 0.15s ease-out'
                        }}
                    >
                        {/* Tooltip Arrow Pointer */}
                        <div className="absolute -left-[9px] top-6 w-4 h-4 bg-white border-l border-t border-gray-200 transform -rotate-45" style={{ zIndex: -1 }}></div>

                        <div className="p-6">
                            <div className="flex flex-col mb-4 bg-gray-50/50 p-2 border border-gray-100">
                                <span className="text-[10px] text-gray-500 font-mono tracking-[0.2em] uppercase">Active Corridor Node // {activeNodeData.id}</span>
                            </div>

                            <h3
                                className="text-2xl text-gray-900 font-bold leading-tight mb-2"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}
                            >
                                {activeNodeData.name}
                            </h3>

                            <div className="w-8 h-px bg-gray-900 mb-4" />

                            <div className="mb-4">
                                <div className="text-[11px] font-mono text-gray-900 uppercase tracking-widest mb-1.5 font-bold">
                                    {activeNodeData.role}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed font-serif">
                                    {activeNodeData.description}
                                </p>
                            </div>

                            {activePillar === 'TRANSPORT' && nextNodeData && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-mono text-blue-500 tracking-widest uppercase mb-1">Direct Connectivity To</span>
                                        <span className="text-xs font-mono text-blue-700 font-bold uppercase tracking-wider">{nextNodeData.name}</span>
                                    </div>
                                    <div className="w-5 h-5 flex items-center justify-center bg-blue-50 text-blue-500 rounded-full">
                                        <span className="font-mono text-[10px] transform md:rotate-0 -rotate-45">→</span>
                                    </div>
                                </div>
                            )}
                            {activePillar !== 'TRANSPORT' && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <span className="text-[9px] font-mono text-purple-600 tracking-widest uppercase mb-1 block">Infrastructure Mode: {activePillar}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interactive Click Dossier Panel */}
            <AnimatePresence>
                {selectedNodeData && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-40 rounded-none overflow-y-auto"
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xs font-mono text-blue-600 tracking-[0.2em] uppercase font-bold">Strategic Dossier</span>
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <span className="font-mono text-xs">X</span>
                                </button>
                            </div>

                            <h2 className="text-4xl text-gray-900 font-bold leading-tight mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.03em' }}>
                                {selectedNodeData.name}
                            </h2>
                            <p className="text-gray-500 font-serif mb-8 text-lg">{selectedNodeData.role}</p>

                            <div className="space-y-6">
                                <div className="border-l-2 border-gray-900 pl-4 py-1">
                                    <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">Committed Investment</h4>
                                    <div className="text-2xl text-gray-900 font-mono">${selectedNodeData.infrastructureInvestment}B</div>
                                </div>

                                <div className="bg-gray-50 p-5 border border-gray-100">
                                    <h4 className="text-[10px] font-mono text-gray-900 uppercase tracking-widest mb-3 font-bold">Geopolitical Intelligence</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed font-serif">
                                        {selectedNodeData.dossierIntelligence}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Three Pillars Toggle Control Bar */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex bg-white shadow-lg border border-gray-200 p-1" style={{ borderRadius: 0 }}>
                {(['TRANSPORT', 'DIGITAL', 'ENERGY'] as Pillar[]).map((pillar) => (
                    <button
                        key={pillar}
                        onClick={() => setActivePillar(pillar)}
                        className={`px-6 py-2 text-[10px] font-mono tracking-widest uppercase transition-all ${activePillar === pillar
                            ? 'bg-gray-900 text-white font-bold'
                            : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        [ {pillar} ]
                    </button>
                ))}
            </div>

            {/* Map Legend & Context Panel */}
            <div className="absolute bottom-8 left-6 z-20 bg-white border border-gray-200 shadow-xl w-[340px] rounded-none pointer-events-auto transition-all duration-300">
                {isLegendOpen ? (
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-[14px] font-bold text-gray-900 font-serif leading-tight">IMEC: Multimodal Connectivity Architecture</h2>
                            <button onClick={() => setIsLegendOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-500 font-serif mb-6 leading-relaxed">
                            Visualizing the integration of maritime, overland rail, digital (Blue-Raman), and energy infrastructure bypassing traditional vulnerable chokepoints.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-6 border-t-2 border-blue-500 border-dashed"></div>
                                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Maritime Transport Route</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 border-t-[2.5px] border-rose-600"></div>
                                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Overland Rail Link</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 border-t-[2.5px] border-purple-500"></div>
                                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Digital Pillar (Blue-Raman)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 border-t-[3px] border-emerald-500"></div>
                                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Energy Pillar (Grid)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 flex justify-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-600 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Strategic Chokepoint Zones</span>
                            </div>
                        </div>

                        <div className="pt-5 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    if (d3ContainerRef.current && (d3ContainerRef.current as any)._resetZoom) {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        (d3ContainerRef.current as any)._resetZoom();
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors text-[10px] font-mono uppercase tracking-[0.2em]"
                            >
                                <Crosshair className="w-3.5 h-3.5" />
                                Reset View
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsLegendOpen(true)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-[10px] font-mono uppercase tracking-[0.2em] text-gray-700"
                    >
                        <span>Map Legend +</span>
                        <ChevronUp className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Informational overlay to act as a legend for D3 layout */}
            <div className="absolute top-8 right-8 z-20 pointer-events-none bg-white/90 backdrop-blur-md border border-gray-200 p-5" style={{ borderRadius: 0 }}>
                <h3 className="text-gray-900 text-[10px] tracking-[0.2em] font-mono uppercase mb-3 text-right">Interactive Topology</h3>
                <div className="flex items-center gap-3 justify-end mb-2">
                    <span className="text-[10px] text-gray-500 font-serif italic">Hover mapping to isolate logic</span>
                    <div className="w-[6px] h-[6px] rounded-full bg-gray-900"></div>
                </div>
                <div className="flex items-center gap-3 justify-end mt-4">
                    <span className="text-[9px] text-gray-400 font-mono tracking-wider uppercase">Investment Depth</span>
                    <div className="flex w-24 h-2 bg-gradient-to-r from-gray-200 to-gray-700 border border-gray-300"></div>
                </div>
            </div>
        </div>
    );
}
