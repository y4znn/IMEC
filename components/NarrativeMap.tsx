'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
// removed framer-motion
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
    dx: number;
    dy: number;
    textAnchor: 'start' | 'middle' | 'end';
}

const imecNodes: NodeData[] = [
    { id: "IND", name: "India", role: "The Eastern Anchor", description: "Primary manufacturing and export terminus. Connects to the Middle East via JNPT and Mundra ports.", next: "OMN", lat: 20.5937, lng: 78.9629, type: 'Sea', infrastructureInvestment: 10, dossierIntelligence: "Eastern Anchor. $10B national port modernization strategy deployed for hubs like Mundra and Vadhavan.", dx: 15, dy: 0, textAnchor: "start" },
    { id: "OMN", name: "Oman", role: "Strategic Bypass", description: "Strategic landing point for the Blue-Raman subsea cable and Hafeet Rail project bypassing traditional bottlenecks.", next: "ARE", lat: 21.4735, lng: 55.9754, type: 'Land', infrastructureInvestment: 2, dossierIntelligence: "Strategic Bypass: The Hafeet Rail project links Sohar port to the UAE, offering a critical supply chain redundancy that bypasses the Strait of Hormuz.", dx: -15, dy: -5, textAnchor: "end" },
    { id: "ARE", name: "United Arab Emirates", role: "The Gulf Transshipment Hub", description: "Jebel Ali and Fujairah serve as the core maritime-to-rail transshipment zone, bypassing the Strait of Hormuz.", next: "SAU", lat: 23.4241, lng: 53.8478, type: 'Land', infrastructureInvestment: 8, dossierIntelligence: "Integration point for GCC grids. Key maritime-to-rail switchyard.", dx: 0, dy: -20, textAnchor: "middle" },
    { id: "SAU", name: "Saudi Arabia", role: "The Desert Land-Bridge", description: "Vast overland railway integration connecting the Persian Gulf to the Jordanian border.", next: "JOR", lat: 23.8859, lng: 45.0792, type: 'Land', infrastructureInvestment: 20, dossierIntelligence: "Integration of the Saudi East Cargo Train; requires 269km of missing rail links from Al-Ghuwaifat (UAE) to Haradh.", dx: 0, dy: -20, textAnchor: "middle" },
    { id: "JOR", name: "Jordan", role: "The Vital Transit", description: "Critical connective tissue bridging Saudi rail lines to Israeli seaports.", next: "ISR", lat: 30.5852, lng: 35.2332, type: 'Land', infrastructureInvestment: 5, dossierIntelligence: "Crucial Bottleneck. Requires $2.09B - $2.6B to build a 225km standard-gauge freight rail linking Al-Haditha to the Israeli border.", dx: 15, dy: -10, textAnchor: "start" },
    { id: "ISR", name: "Israel", role: "The Mediterranean Hinge", description: "Haifa port acts as the final exit point before entering European waters.", next: "GRC", lat: 31.0461, lng: 34.8516, type: 'Sea', infrastructureInvestment: 6, dossierIntelligence: "Haifa Port Modernization. Terrestrial fusion point for the Blue-Raman data cable bypassing Egypt.", dx: -15, dy: -10, textAnchor: "end" },
    { id: "GRC", name: "Greece", role: "The European Entry", description: "Piraeus port serves as the immediate geographic gateway into the EU market.", next: "ITA", lat: 39.0742, lng: 21.8243, type: 'Sea', infrastructureInvestment: 4, dossierIntelligence: "European entry point distributing energy and digital payloads deep into the EU.", dx: -15, dy: -10, textAnchor: "end" },
    { id: "ITA", name: "Italy", role: "The Central Artery", description: "Core Mediterranean distribution hub for continental supply chains.", next: "FRA", lat: 41.8719, lng: 12.5674, type: 'Land', infrastructureInvestment: 5, dossierIntelligence: "Continental supply chain distributor for Western Europe.", dx: -15, dy: -5, textAnchor: "end" },
    { id: "FRA", name: "France", role: "The Western Terminus", description: "Marseille acts as the final strategic locus for Western European integration.", next: null, lat: 46.2276, lng: 2.2137, type: 'Land', infrastructureInvestment: 4, dossierIntelligence: "Western terminus concluding the Blue-Raman route.", dx: -15, dy: 5, textAnchor: "end" }
];

const imecCountryIds = imecNodes.map(n => n.id);

const chokepoints = [
    { id: "SUEZ", name: "Suez Canal", lat: 30.5852, lng: 32.2654, description: "Strategic Vulnerability: Houthi threats have reduced Suez Canal container crossings by 90%, necessitating the IMEC overland bypass." },
    { id: "BAM", name: "Bab el-Mandeb", lat: 12.5833, lng: 43.3333, description: "Strategic Vulnerability: Critical Red Sea access point entirely compromised by asymmetrical warfare, shutting off the Eastern Mediterranean from Asia." }
];

export default function NarrativeMap() {
    const containerRef = useRef<HTMLDivElement>(null);
    const d3ContainerRef = useRef<HTMLDivElement>(null);
    const [activePillar, setActivePillar] = useState<Pillar>('TRANSPORT');
    const [isLegendOpen, setIsLegendOpen] = useState(true);
    const [topology, setTopology] = useState<TopoJSON.Topology | null>(null);
    
    // For cleaning up the resize observer across renders if needed
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // EFFECT 1: Fetch Map Data Once
    useEffect(() => {
        let isMounted = true;
        const fetchTopology = async () => {
            try {
                const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
                const data = await res.json();
                if (isMounted) {
                    setTopology(data);
                }
            } catch (err) {
                console.error("Failed to load map data", err);
            }
        };
        fetchTopology();
        return () => { isMounted = false; };
    }, []);

    // EFFECT 2: Render & Update D3 Logic
    useEffect(() => {
        if (!topology || !d3ContainerRef.current || !containerRef.current) return;
        
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Clear previous renders (destroy entire map to rebuild cleanly or setup base map)
        d3.select(d3ContainerRef.current).selectAll("*").remove();

        const svg = d3.select(d3ContainerRef.current)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("position", "absolute")
            .style("top", 0)
            .style("left", 0)
            .style("z-index", 1) // Ensure it sits above background
            .style("cursor", "crosshair");

        const g = svg.append("g");

        // Natural Earth projection mapping to Eurasia + Africa roughly
        const projection = d3.geoNaturalEarth1()
            .scale(width / 3.5)
            .translate([width / 2.2, height / 1.7])
            .center([40, 25]); // Rough center roughly over middle east

        const path = d3.geoPath().projection(projection);

        // Set up zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 8])
            .wheelDelta((event) => -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002))
            .on("zoom", (event) => {
                g.attr("transform", event.transform);

                // CRITICAL: Semantic scaling (keep elements crisp and thin regardless of zoom)
                g.selectAll("path.country").style("stroke-width", 0.5 / event.transform.k + "px");
                g.selectAll("path.trade-route").style("stroke-width", function () {
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
                    return `translate(${x}, ${y}) scale(${1 / event.transform.k})`;
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

        // Render Base Map
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geojson = topojson.feature(topology, (topology.objects.countries) as any) as any;

        const maxInvestment = d3.max(imecNodes, d => d.infrastructureInvestment) || 20;
        const colorScale = d3.scaleLinear<string>()
            .domain([0, maxInvestment])
            .range(["#E5E7EB", "#374151"]);

        // Render all countries
        g.selectAll("path.country")
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
            .style("stroke", (d: any) => imecCountryIds.includes(d.id) ? "#6B7280" : "#9CA3AF")
            .style("stroke-width", "1px")
            .style("pointer-events", "none");

        // Recreate nodes selection as groups
        const nodeSelection = g.selectAll("g.node-group")
            .data(imecNodes)
            .join("g")
            .attr("class", "node-group")
            .attr("transform", d => {
                const [x, y] = projection([d.lng, d.lat]) || [0, 0];
                return `translate(${x}, ${y}) scale(1)`;
            })
            .style("opacity", 1)
            .style("pointer-events", "all"); // Important: Ensure nodes capture events

        nodeSelection.selectAll("circle.node-bg")
            .data(d => [d])
            .join("circle")
            .attr("class", "node-bg")
            .attr("r", 9)
            .style("fill", "#111827")
            .style("stroke", "#ffffff")
            .style("stroke-width", "1.5px");

        const anchorPath = "M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
        const trainPath = "M4 11h16M12 3v8m-4 8-2 3m10-3-2-3M8 15h0m8 0h0M6 3h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z";

        nodeSelection.selectAll("path.icon")
            .data(d => [d])
            .join("path")
            .attr("class", "icon")
            .attr("d", d => {
                const id = (d as NodeData).id;
                if (id === 'OMN') return "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z";
                return ["IND", "ARE", "ISR", "GRC", "ITA", "FRA"].includes(id) ? anchorPath : trainPath
            })
            .style("fill", "none")
            .style("stroke", "#ffffff")
            .style("stroke-width", "2.5px")
            .style("stroke-linecap", "round")
            .style("stroke-linejoin", "round")
            .attr("transform", "translate(-6, -6) scale(0.5)")
            .style("pointer-events", "none");

        // Native SVG Text Labels (Halo Title)
        nodeSelection.selectAll("text.halo-title")
            .data(d => [d])
            .join("text")
            .attr("class", "halo-title")
            .attr("dx", d => (d as NodeData).dx)
            .attr("dy", d => (d as NodeData).dy)
            .attr("text-anchor", d => (d as NodeData).textAnchor)
            .text(d => (d as NodeData).name)
            .style("font-family", "serif")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "none")
            .style("stroke", "#FFFFFF")
            .style("stroke-width", "4px")
            .style("stroke-linejoin", "round")
            .style("opacity", "0.9")
            .style("pointer-events", "none");

        // Halo Subtitle/Role
        nodeSelection.selectAll("text.halo-role")
            .data(d => [d])
            .join("text")
            .attr("class", "halo-role")
            .attr("dx", d => (d as NodeData).dx)
            .attr("dy", d => (d as NodeData).dy + 14)
            .attr("text-anchor", d => (d as NodeData).textAnchor)
            .text(d => (d as NodeData).role)
            .style("font-family", "monospace")
            .style("font-size", "10px")
            .style("fill", "none")
            .style("stroke", "#FFFFFF")
            .style("stroke-width", "4px")
            .style("stroke-linejoin", "round")
            .style("opacity", "0.9")
            .style("pointer-events", "none");

        // Core Title
        nodeSelection.selectAll("text.core-title")
            .data(d => [d])
            .join("text")
            .attr("class", "core-title")
            .attr("dx", d => (d as NodeData).dx)
            .attr("dy", d => (d as NodeData).dy)
            .attr("text-anchor", d => (d as NodeData).textAnchor)
            .text(d => (d as NodeData).name)
            .style("font-family", "serif")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#111827")
            .style("pointer-events", "none");

        // Core Subtitle/Role
        nodeSelection.selectAll("text.core-role")
            .data(d => [d])
            .join("text")
            .attr("class", "core-role")
            .attr("dx", d => (d as NodeData).dx)
            .attr("dy", d => (d as NodeData).dy + 14)
            .attr("text-anchor", d => (d as NodeData).textAnchor)
            .text(d => (d as NodeData).role)
            .style("font-family", "monospace")
            .style("font-size", "10px")
            .style("fill", "#4B5563")
            .style("pointer-events", "none");

        // Render Chokepoints
        const chokepointSelection = g.selectAll("g.chokepoint-group")
            .data(chokepoints)
            .join("g")
            .attr("class", "chokepoint-group")
            .attr("transform", d => {
                const [x, y] = projection([d.lng, d.lat]) || [0, 0];
                return `translate(${x}, ${y}) scale(1)`;
            })
            .style("pointer-events", "all") // Important: Ensure chokepoints capture events
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
            .style("stroke-width", "1px")
            .style("pointer-events", "none");

        chokepointSelection.selectAll("title")
            .data(d => [d])
            .join("title")
            .text(d => d.description);

        // Animate Chokepoints continuously
        const animateChokepoints = () => {
            const cpPulse = chokepointSelection.selectAll("circle.cp-pulse")
                .attr("r", 4)
                .style("opacity", 0.8);
            
            const loop = () => {
                cpPulse.transition()
                    .duration(2000)
                    .ease(d3.easeCircleOut)
                    .attr("r", 15)
                    .style("opacity", 0)
                    .on("end", loop);
            };
            loop();
        };
        animateChokepoints();

        // TASK B: Fix "Ghost Lines" via explicitly removing the old ones
        g.selectAll("path.trade-route").remove();

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
                    const haloWidth = 6;
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

                    // Render Halo layer (Task D: Explicit pointer-events none)
                    g.append("path")
                        .attr("class", "trade-route connection halo")
                        .attr("data-basewidth", haloWidth)
                        .attr("d", pathData)
                        .style("fill", "none")
                        .style("stroke", haloColor)
                        .style("stroke-width", (haloWidth / k) + "px")
                        .style("opacity", haloOpacity)
                        .style("stroke-linecap", "round")
                        .style("pointer-events", "none");

                    // Render Core layer (Task D: Explicit pointer-events none)
                    g.append("path")
                        .attr("class", "trade-route connection core")
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
        if (activePillar === 'TRANSPORT') {
            imecNodes.forEach(node => {
                if (node.next) {
                    const type = node.type === 'Sea' ? 'TRANSPORT_SEA' : 'TRANSPORT_LAND';
                    drawConnection(node.id, node.next, type);
                }
            });
        } else if (activePillar === 'DIGITAL') {
            // Draw Blue-Raman static route
            drawConnection("IND", "OMN", "DIGITAL");
            drawConnection("OMN", "SAU", "DIGITAL");
            drawConnection("SAU", "JOR", "DIGITAL");
            drawConnection("JOR", "ISR", "DIGITAL");
            drawConnection("ISR", "GRC", "DIGITAL");
            drawConnection("GRC", "ITA", "DIGITAL");
            drawConnection("ITA", "FRA", "DIGITAL");
        } else if (activePillar === 'ENERGY') {
            // Draw Energy routes (NEOM & GCC)
            drawConnection("SAU", "JOR", "ENERGY"); // Hydrogen pipeline to Med
            drawConnection("JOR", "ISR", "ENERGY");
            drawConnection("SAU", "ARE", "ENERGY"); // GCC Grid
        }

        // TASK C: Safe ResizeObserver Implementation
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }
        
        resizeObserverRef.current = new ResizeObserver(() => {
            if (!topology || !g.selectAll) return; // Strict guard
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
            
            // Re-draw connections on resize by removing and drawing
            g.selectAll("path.trade-route").remove();
            if (activePillar === 'TRANSPORT') {
                imecNodes.forEach(node => {
                    if (node.next) {
                        const type = node.type === 'Sea' ? 'TRANSPORT_SEA' : 'TRANSPORT_LAND';
                        drawConnection(node.id, node.next, type);
                    }
                });
            } else if (activePillar === 'DIGITAL') {
                drawConnection("IND", "OMN", "DIGITAL");
                drawConnection("OMN", "SAU", "DIGITAL");
                drawConnection("SAU", "JOR", "DIGITAL");
                drawConnection("JOR", "ISR", "DIGITAL");
                drawConnection("ISR", "GRC", "DIGITAL");
                drawConnection("GRC", "ITA", "DIGITAL");
                drawConnection("ITA", "FRA", "DIGITAL");
            } else if (activePillar === 'ENERGY') {
                drawConnection("SAU", "JOR", "ENERGY"); 
                drawConnection("JOR", "ISR", "ENERGY");
                drawConnection("SAU", "ARE", "ENERGY"); 
            }
        });

        resizeObserverRef.current.observe(container);

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, [topology, activePillar]); // Make sure to only use these dependencies

    return (
        <div ref={containerRef} className="w-full h-full relative" style={{ overflow: 'hidden' }}>
            {/* The SVG element is injected via D3 into this container element natively */}
            <div ref={d3ContainerRef} className="absolute inset-0" />



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
                <h3 className="text-gray-900 text-[10px] tracking-[0.2em] font-mono uppercase mb-3 text-right">Topology Base Map</h3>
                <div className="flex items-center gap-3 justify-end mt-4">
                    <span className="text-[9px] text-gray-400 font-mono tracking-wider uppercase">Investment Depth</span>
                    <div className="flex w-24 h-2 bg-gradient-to-r from-gray-200 to-gray-700 border border-gray-300"></div>
                </div>
            </div>
        </div>
    );
}
