'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Activity } from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   NODE & LINK DATA
   ══════════════════════════════════════════════════════════ */

type NeuralNode = {
    id: string;
    date: string;
    text: string;
    color: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
};

type NeuralLink = {
    source: string | NeuralNode;
    target: string | NeuralNode;
};

const NODES: NeuralNode[] = [
    {
        id: 'n1',
        date: 'Sept 2023',
        text: 'G20 Summit: IMEC Officially Announced.',
        color: '#94a3b8', // Muted steel
    },
    {
        id: 'n2',
        date: 'Oct 2023',
        text: 'October 7th: Gaza War erupts, stalling regional normalization.',
        color: '#a1937c', // Muted amber
    },
    {
        id: 'n3',
        date: 'Late 2023',
        text: "Red Sea Crisis: 90% drop in Suez container traffic validates IMEC's necessity.",
        color: '#a1937c', // Muted amber
    },
    {
        id: 'n4',
        date: 'Feb 2024',
        text: 'India-UAE Framework Agreement signed to operationalize logistics.',
        color: '#94a3b8', // Muted steel
    },
    {
        id: 'n5',
        date: 'Feb 2025',
        text: 'Trump-Modi White House Summit revives IMEC momentum.',
        color: '#7c8da6', // Muted blue
    },
];

const LINKS: NeuralLink[] = [
    { source: 'n1', target: 'n2' },
    { source: 'n2', target: 'n3' },
    { source: 'n3', target: 'n4' },
    { source: 'n4', target: 'n5' },
    // Cross-links for neural network aesthetic
    { source: 'n1', target: 'n3' },
    { source: 'n2', target: 'n4' },
    { source: 'n3', target: 'n5' },
    { source: 'n1', target: 'n4' },
];

/* ══════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function NeuroplasticityTimeline() {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [, setHovered] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        node: NeuralNode;
    } | null>(null);

    const drawChart = useCallback(() => {
        if (!svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const { width, height } = container.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        svg.attr('width', width).attr('height', height);

        // Deep clone data so D3 doesn't mutate our source arrays
        const nodes: NeuralNode[] = NODES.map((n) => ({ ...n }));
        const links: NeuralLink[] = LINKS.map((l) => ({ ...l }));

        // ── Defs: Glow filters & gradients ──
        const defs = svg.append('defs');

        // Glow filter for nodes
        const glowFilter = defs.append('filter').attr('id', 'neural-glow');
        glowFilter
            .append('feGaussianBlur')
            .attr('stdDeviation', '6')
            .attr('result', 'coloredBlur');
        const feMerge = glowFilter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Soft glow for links
        const linkGlow = defs.append('filter').attr('id', 'link-glow');
        linkGlow
            .append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'blur');
        const linkMerge = linkGlow.append('feMerge');
        linkMerge.append('feMergeNode').attr('in', 'blur');
        linkMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Radial gradients per node
        nodes.forEach((n) => {
            const grad = defs
                .append('radialGradient')
                .attr('id', `grad-${n.id}`)
                .attr('cx', '50%')
                .attr('cy', '50%')
                .attr('r', '50%');
            grad
                .append('stop')
                .attr('offset', '0%')
                .attr('stop-color', n.color)
                .attr('stop-opacity', 0.9);
            grad
                .append('stop')
                .attr('offset', '100%')
                .attr('stop-color', n.color)
                .attr('stop-opacity', 0);
        });

        // ── Main group ──
        const g = svg.append('g');

        // ── Force simulation ──
        // Position nodes along a horizontal timeline
        const xScale = d3
            .scalePoint<string>()
            .domain(nodes.map((n) => n.id))
            .range([width * 0.12, width * 0.88])
            .padding(0.1);

        nodes.forEach((n) => {
            n.x = xScale(n.id)!;
            n.y = height / 2 + (Math.random() - 0.5) * (height * 0.25);
            n.fx = n.x;
            n.fy = null;
        });

        const simulation = d3
            .forceSimulation(nodes)
            .force(
                'link',
                d3
                    .forceLink<NeuralNode, NeuralLink>(links)
                    .id((d) => d.id)
                    .distance(120)
                    .strength(0.3)
            )
            .force('charge', d3.forceManyBody().strength(-200))
            .force('y', d3.forceY(height / 2).strength(0.15))
            .alphaDecay(0.03);

        // Pin x positions for chronological order
        nodes.forEach((n) => {
            n.fx = xScale(n.id)!;
        });

        // ── Draw Links ──
        const linkGroup = g.append('g').attr('class', 'links');
        const linkElements = linkGroup
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', 'rgba(113, 113, 122, 0.2)')
            .attr('stroke-width', 1)
            .attr('filter', 'url(#link-glow)');

        // ── Data Particles (flowing along links) ──
        const particleGroup = g.append('g').attr('class', 'particles');
        type ParticleData = { link: NeuralLink; offset: number; speed: number };
        const particles: ParticleData[] = [];
        links.forEach((link) => {
            // 2 particles per link at different offsets
            particles.push({ link, offset: Math.random(), speed: 0.003 + Math.random() * 0.004 });
            particles.push({ link, offset: Math.random(), speed: 0.002 + Math.random() * 0.003 });
        });

        const particleElements = particleGroup
            .selectAll('circle')
            .data(particles)
            .join('circle')
            .attr('r', 1.5)
            .attr('fill', '#71717a')
            .attr('opacity', 0.5);

        // ── Draw Nodes ──
        const nodeGroup = g.append('g').attr('class', 'nodes');

        // Outer glow halo
        nodeGroup
            .selectAll('circle.halo')
            .data(nodes)
            .join('circle')
            .attr('class', 'halo')
            .attr('r', 28)
            .attr('fill', (d) => `url(#grad-${d.id})`)
            .attr('opacity', 0.3);

        // Inner solid node
        const nodeCircles = nodeGroup
            .selectAll<SVGCircleElement, NeuralNode>('circle.node')
            .data(nodes)
            .join('circle')
            .attr('class', 'node')
            .attr('r', 10)
            .attr('fill', (d) => d.color)
            .attr('filter', 'url(#neural-glow)')
            .attr('cursor', 'pointer')
            .attr('stroke', 'rgba(255,255,255,0.15)')
            .attr('stroke-width', 1);

        // Date labels
        const labels = nodeGroup
            .selectAll<SVGTextElement, NeuralNode>('text')
            .data(nodes)
            .join('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 30)
            .attr('fill', 'rgba(148, 163, 184, 0.7)')
            .attr('font-size', '10px')
            .attr('font-family', "'Inter', sans-serif")
            .text((d) => d.date);

        // Halo elements reference
        const halos = nodeGroup.selectAll<SVGCircleElement, NeuralNode>('circle.halo');

        // ── Hover interactions ──
        const connectedNodes = new Map<string, Set<string>>();
        nodes.forEach((n) => connectedNodes.set(n.id, new Set([n.id])));
        links.forEach((l) => {
            const src = typeof l.source === 'string' ? l.source : l.source.id;
            const tgt = typeof l.target === 'string' ? l.target : l.target.id;
            connectedNodes.get(src)?.add(tgt);
            connectedNodes.get(tgt)?.add(src);
        });

        nodeCircles
            .on('mouseenter', function (event: MouseEvent, d: NeuralNode) {
                setHovered(d.id);

                const connected = connectedNodes.get(d.id) || new Set();

                // Dim non-connected nodes
                nodeCircles
                    .transition()
                    .duration(200)
                    .attr('opacity', (n: NeuralNode) => (connected.has(n.id) ? 1 : 0.15))
                    .attr('r', (n: NeuralNode) => (n.id === d.id ? 14 : 10));

                halos
                    .transition()
                    .duration(200)
                    .attr('opacity', (n: NeuralNode) => (connected.has(n.id) ? 0.5 : 0.05))
                    .attr('r', (n: NeuralNode) => (n.id === d.id ? 36 : 28));

                labels
                    .transition()
                    .duration(200)
                    .attr('opacity', (n: NeuralNode) => (connected.has(n.id) ? 1 : 0.1));

                // Dim non-connected links
                linkElements
                    .transition()
                    .duration(200)
                    .attr('stroke-opacity', (l: NeuralLink) => {
                        const src = typeof l.source === 'string' ? l.source : (l.source as NeuralNode).id;
                        const tgt = typeof l.target === 'string' ? l.target : (l.target as NeuralNode).id;
                        return src === d.id || tgt === d.id ? 1 : 0.05;
                    })
                    .attr('stroke', (l: NeuralLink) => {
                        const src = typeof l.source === 'string' ? l.source : (l.source as NeuralNode).id;
                        const tgt = typeof l.target === 'string' ? l.target : (l.target as NeuralNode).id;
                        return src === d.id || tgt === d.id ? d.color : 'rgba(139, 92, 246, 0.25)';
                    });

                // Tooltip
                const rect = container.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top - 20,
                    node: d,
                });
            })
            .on('mousemove', function (event: MouseEvent, d: NeuralNode) {
                const rect = container.getBoundingClientRect();
                setTooltip({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top - 20,
                    node: d,
                });
            })
            .on('mouseleave', function () {
                setHovered(null);
                setTooltip(null);

                nodeCircles
                    .transition()
                    .duration(300)
                    .attr('opacity', 1)
                    .attr('r', 10);

                halos.transition().duration(300).attr('opacity', 0.3).attr('r', 28);
                labels.transition().duration(300).attr('opacity', 1);

                linkElements
                    .transition()
                    .duration(300)
                    .attr('stroke-opacity', 1)
                    .attr('stroke', 'rgba(113, 113, 122, 0.2)');
            });

        // ── Pulsing animation ──
        function pulse() {
            nodeCircles
                .transition()
                .duration(2000)
                .ease(d3.easeSinInOut)
                .attr('r', 12)
                .transition()
                .duration(2000)
                .ease(d3.easeSinInOut)
                .attr('r', 10)
                .on('end', function () {
                    // Only continue pulsing if not hovered
                    if (!containerRef.current?.querySelector(':hover')) {
                        pulse();
                    } else {
                        setTimeout(pulse, 2000);
                    }
                });
        }
        pulse();

        // ── Tick handler ──
        simulation.on('tick', () => {
            linkElements
                .attr('x1', (d) => (d.source as NeuralNode).x!)
                .attr('y1', (d) => (d.source as NeuralNode).y!)
                .attr('x2', (d) => (d.target as NeuralNode).x!)
                .attr('y2', (d) => (d.target as NeuralNode).y!);

            nodeCircles.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);

            halos.attr('cx', (d: NeuralNode) => d.x!).attr('cy', (d: NeuralNode) => d.y!);

            labels.attr('x', (d) => d.x!).attr('y', (d) => d.y!);

            // Update particles
            particleElements.each(function (p) {
                p.offset = (p.offset + p.speed) % 1;
                const src = p.link.source as NeuralNode;
                const tgt = p.link.target as NeuralNode;
                const x = src.x! + (tgt.x! - src.x!) * p.offset;
                const y = src.y! + (tgt.y! - src.y!) * p.offset;
                d3.select(this).attr('cx', x).attr('cy', y);
            });
        });
    }, []);

    useEffect(() => {
        drawChart();

        const observer = new ResizeObserver(() => {
            drawChart();
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [drawChart]);

    return (
        <div className="rounded-xl border border-zinc-800/40 bg-zinc-950/40 overflow-hidden h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800/40">
                <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.2} />
                    <h2
                        className="text-[15px] font-semibold text-zinc-200 tracking-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        IMEC Neuroplasticity Timeline
                    </h2>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Chronological neural map of pivotal events shaping the corridor&apos;s evolution.
                </p>
            </div>

            {/* D3 Canvas */}
            <div
                ref={containerRef}
                className="relative w-full"
                style={{ height: 340, background: 'radial-gradient(ellipse at 50% 50%, rgba(24, 24, 27, 0.4) 0%, rgba(0, 0, 0, 0.95) 70%)' }}
            >
                <svg ref={svgRef} className="w-full h-full" />

                {/* Tooltip */}
                {tooltip && (
                    <div
                        className="absolute z-50 pointer-events-none"
                        style={{
                            left: tooltip.x,
                            top: tooltip.y,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div
                            className="px-4 py-3 rounded-xl backdrop-blur-xl border max-w-[260px]"
                            style={{
                                background: 'rgba(9, 9, 11, 0.9)',
                                borderColor: `${tooltip.node.color}33`,
                                boxShadow: `0 0 30px ${tooltip.node.color}22`,
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                        background: tooltip.node.color,
                                        boxShadow: `0 0 10px ${tooltip.node.color}`,
                                    }}
                                />
                                <span
                                    className="text-[10px] font-mono tracking-wider uppercase font-semibold"
                                    style={{ color: tooltip.node.color }}
                                >
                                    {tooltip.node.date}
                                </span>
                            </div>
                            <p className="text-[12px] text-zinc-300 leading-relaxed">
                                {tooltip.node.text}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
