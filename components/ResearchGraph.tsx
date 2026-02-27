'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Network } from 'lucide-react';

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    group: number;
    val: number;
    text: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    value: number;
}

/* ── Graph Data ── */
// The core themes for the D3 force-directed graph
const graphData = {
    nodes: [
        { id: 'Realism', group: 1, val: 30, text: 'Neoclassical Realism' },
        { id: 'Suez', group: 2, val: 24, text: 'Suez Vulnerability' },
        { id: 'IMEC', group: 1, val: 35, text: 'IMEC Architecture' },
        { id: 'DRP', group: 3, val: 22, text: 'Development Road' },
        { id: 'BlueRaman', group: 1, val: 20, text: 'Blue-Raman Cable' },
        { id: 'BRI', group: 3, val: 28, text: 'China BRI' },
        { id: 'Gaza', group: 2, val: 25, text: 'Regional Conflict' },
    ],
    links: [
        { source: 'IMEC', target: 'Realism', value: 2 },
        { source: 'IMEC', target: 'Suez', value: 4 },
        { source: 'IMEC', target: 'BlueRaman', value: 3 },
        { source: 'DRP', target: 'BRI', value: 3 },
        { source: 'DRP', target: 'Realism', value: 2 },
        { source: 'Suez', target: 'Gaza', value: 4 },
        { source: 'IMEC', target: 'Gaza', value: 3 },
        { source: 'IMEC', target: 'DRP', value: 1 }, // Competitive link
    ],
};

export default function ResearchGraph() {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

    // Handle Resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: 400,
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Drag behavior definition
    function drag(simulation: d3.Simulation<GraphNode, undefined>) {
        function dragstarted(event: d3.D3DragEvent<Element, GraphNode, GraphNode>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: d3.D3DragEvent<Element, GraphNode, GraphNode>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<Element, GraphNode, GraphNode>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag<Element, GraphNode>()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended) as never; // Hack to bypass strict d3 typing issue with 'call'
    }

    // Build the D3 Graph
    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0) return;

        const { width, height } = dimensions;

        // Clear previous render entirely
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Deep copy data because force overrides objects
        const links = graphData.links.map((d) => Object.create(d));
        const nodes = graphData.nodes.map((d) => Object.create(d));

        // Group colors mapped to the Enterprise Minimalism theme
        const colorScale = d3.scaleOrdinal<number, string>()
            .domain([1, 2, 3])
            .range(['#94a3b8', '#a1937c', '#9c7373']); // Muted steel (IMEC), Muted amber (Vulnerabilities), Muted rose (Rivals)

        // Setup physics simulation
        const simulation = d3.forceSimulation<GraphNode>(nodes)
            .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.val + 10));

        // Links
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', 'url(#linkGrad)')
            .attr('stroke-width', (d) => Math.sqrt(d.value) * 1.5)
            .attr('stroke-dasharray', (d) => {
                const src = d.source as GraphNode;
                const tgt = d.target as GraphNode;
                return (src.id === 'IMEC' && tgt.id === 'DRP') ? '4,4' : '15,15';
            });

        // Animate links
        d3.timer((elapsed) => {
            link.attr('stroke-dashoffset', -elapsed / 30);
        });

        // Node Groups (Circle + Text)
        const node = svg.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(drag(simulation));

        // Outer Glow (blurry)
        node.append('circle')
            .attr('r', (d) => d.val * 1.4)
            .attr('fill', (d) => colorScale(d.group))
            .attr('opacity', 0.07)
            .style('filter', 'url(#glow)');

        // Inner solid node
        node.append('circle')
            .attr('r', (d) => d.val)
            .attr('fill', '#000') // pure black
            .attr('stroke', (d) => colorScale(d.group))
            .attr('stroke-width', 1)
            .attr('class', 'node-circle transition-all duration-300');

        // Labels
        node.append('text')
            .text((d) => d.text)
            .attr('text-anchor', 'middle')
            .attr('fill', '#d4d4d8') // zinc-300
            .attr('font-size', '10px')
            .attr('font-family', 'var(--font-mono)')
            .attr('dy', 4)
            .attr('pointer-events', 'none');

        node.on('mouseover', function () {
            d3.select(this).select('.node-circle')
                .attr('stroke-width', 3)
                .style('filter', 'url(#glow)');
        }).on('mouseout', function () {
            d3.select(this).select('.node-circle')
                .attr('stroke-width', 1)
                .style('filter', null);
        });

        // Apply filters (Glow definition)
        const defs = svg.append('defs');
        const filter = defs.append('filter').attr('id', 'glow');
        filter.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Animated Link Gradient
        const linkGrad = defs.append('linearGradient')
            .attr('id', 'linkGrad')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%');

        linkGrad.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(255,255,255,0.05)');
        linkGrad.append('stop').attr('offset', '50%').attr('stop-color', 'rgba(255,255,255,0.4)');
        linkGrad.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(255,255,255,0.05)');

        // We use dasharray/offset to animate flow instead of pure gradient transform logic
        // due to userSpaceOnUse constraints across different lengths, let's just animate the dash offset directly on the links.

        simulation.on('tick', () => {
            link
                .attr('x1', (d) => (d.source as GraphNode).x!)
                .attr('y1', (d) => (d.source as GraphNode).y!)
                .attr('x2', (d) => (d.target as GraphNode).x!)
                .attr('y2', (d) => (d.target as GraphNode).y!);

            node.attr('transform', (d) => `translate(${d.x},${d.y})`);
        });

        // Fast-forward simulation to stabilize quickly (per user prompt)
        for (let i = 0; i < 50; ++i) simulation.tick();

        // Let it run out naturally after the fast-forward 
        setTimeout(() => simulation.stop(), 3000);

        return () => {
            simulation.stop();
        };
    }, [dimensions]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
        >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
                <Network className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.2} />
                <span className="text-[11px] font-mono text-zinc-500 tracking-wider uppercase">
                    Theoretical Ontology Graph
                </span>
            </div>
            <div ref={containerRef} className="w-full relative bg-black/50">
                <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                <div className="absolute bottom-4 right-4 pointer-events-none flex gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-zinc-400/20 border border-zinc-400" />
                        IMEC Node
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500">
                        <span className="w-2 h-2 rounded-full bg-zinc-500/20 border border-zinc-500" />
                        Vulnerability
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500">
                        <span className="w-2 h-2 rounded-full bg-zinc-500/20 border border-zinc-500" />
                        Rival Architecture
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
