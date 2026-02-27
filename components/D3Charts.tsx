'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Clock, DollarSign } from 'lucide-react';

export default function D3Charts() {
    const transitChartRef = useRef<SVGSVGElement>(null);
    const costChartRef = useRef<SVGSVGElement>(null);

    function renderTransitChart() {
        if (!transitChartRef.current) return;

        const transitData = [
            { route: 'IMEC Multi-Modal', days: 14, color: '#6b8f7e' },
            { route: 'Suez Maritime', days: 25, color: '#9c7373' },
        ];

        d3.select(transitChartRef.current).selectAll('*').remove();

        const margin = { top: 16, right: 50, bottom: 24, left: 110 };
        const width = 420 - margin.left - margin.right;
        const height = 160 - margin.top - margin.bottom;

        const svg = d3
            .select(transitChartRef.current)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([0, 30]).range([0, width]);

        const y = d3
            .scaleBand()
            .domain(transitData.map((d) => d.route))
            .range([0, height])
            .padding(0.35);

        // Y Axis
        svg.append('g')
            .call(d3.axisLeft(y).tickSize(0))
            .selectAll('text')
            .style('fill', '#a1a1aa')
            .style('font-family', 'var(--font-mono, monospace)')
            .style('font-weight', '500')
            .style('font-size', '10px');

        svg.select('.domain').remove();

        // Grid lines
        svg.append('g')
            .selectAll('line')
            .data(x.ticks(6))
            .join('line')
            .attr('x1', (d) => x(d))
            .attr('x2', (d) => x(d))
            .attr('y1', 0)
            .attr('y2', height)
            .style('stroke', 'rgba(255,255,255,0.04)')
            .style('stroke-dasharray', '2,4');

        // Bars
        svg.selectAll('rect')
            .data(transitData)
            .join('rect')
            .attr('x', 0)
            .attr('y', (d) => y(d.route) as number)
            .attr('height', y.bandwidth())
            .attr('fill', (d) => d.color)
            .attr('rx', 3)
            .attr('opacity', 0.85)
            .attr('width', 0)
            .transition()
            .duration(1200)
            .ease(d3.easeCubicOut)
            .attr('width', (d) => x(d.days));

        // Labels on bars
        svg.selectAll('.label')
            .data(transitData)
            .join('text')
            .attr('class', 'label')
            .attr('y', (d) => (y(d.route) as number) + y.bandwidth() / 2 + 4)
            .attr('x', 5)
            .style('fill', '#fafafa')
            .style('font-family', 'var(--font-mono, monospace)')
            .style('font-weight', '600')
            .style('font-size', '11px')
            .style('opacity', 0)
            .transition()
            .duration(1200)
            .ease(d3.easeCubicOut)
            .attr('x', (d) => x(d.days) + 6)
            .style('opacity', 1)
            .text((d) => `${d.days} Days`);
    }

    function renderCostChart() {
        if (!costChartRef.current) return;

        d3.select(costChartRef.current).selectAll('*').remove();

        const margin = { top: 16, right: 20, bottom: 28, left: 40 };
        const width = 420 - margin.left - margin.right;
        const height = 160 - margin.top - margin.bottom;

        const svg = d3
            .select(costChartRef.current)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const lineData = [
            { year: 2024, cost: 100 },
            { year: 2025, cost: 95 },
            { year: 2026, cost: 85 },
            { year: 2027, cost: 75 },
            { year: 2028, cost: 70 },
        ];

        const x = d3.scaleLinear().domain([2024, 2028]).range([0, width]);
        const y = d3.scaleLinear().domain([55, 105]).range([height, 0]);

        // X Axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
            .selectAll('text')
            .style('fill', '#71717a')
            .style('font-family', 'var(--font-mono, monospace)')
            .style('font-size', '9px');

        // Y Axis
        svg.append('g')
            .call(d3.axisLeft(y).ticks(4))
            .selectAll('text')
            .style('fill', '#71717a')
            .style('font-family', 'var(--font-mono, monospace)')
            .style('font-size', '9px');

        svg.selectAll('.domain').style('stroke', 'rgba(255,255,255,0.06)');
        svg.selectAll('.tick line').style('stroke', 'rgba(255,255,255,0.04)');

        // Gradient definition
        const defs = svg.append('defs');
        const gradient = defs
            .append('linearGradient')
            .attr('id', 'area-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', '#7c8da6').attr('stop-opacity', 0.25);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', '#7c8da6').attr('stop-opacity', 0.02);

        // Area
        const area = d3
            .area<{ year: number; cost: number }>()
            .x((d) => x(d.year))
            .y0(height)
            .y1((d) => y(d.cost))
            .curve(d3.curveMonotoneX);

        // Clip path for animation
        svg.append('clipPath')
            .attr('id', 'cost-clip')
            .append('rect')
            .attr('width', 0)
            .attr('height', height + 10)
            .attr('y', -5)
            .transition()
            .duration(1800)
            .ease(d3.easeCubicOut)
            .attr('width', width + 10);

        svg.append('path')
            .datum(lineData)
            .attr('fill', 'url(#area-gradient)')
            .attr('d', area)
            .attr('clip-path', 'url(#cost-clip)');

        // Line
        const line = d3
            .line<{ year: number; cost: number }>()
            .x((d) => x(d.year))
            .y((d) => y(d.cost))
            .curve(d3.curveMonotoneX);

        svg.append('path')
            .datum(lineData)
            .attr('fill', 'none')
            .attr('stroke', '#7c8da6')
            .attr('stroke-width', 1.5)
            .attr('d', line)
            .attr('clip-path', 'url(#cost-clip)');

        // End dot + label
        svg.append('circle')
            .attr('cx', x(2028))
            .attr('cy', y(70))
            .attr('r', 4)
            .attr('fill', '#6b8f7e')
            .style('opacity', 0)
            .transition()
            .delay(1800)
            .duration(400)
            .style('opacity', 1);

        svg.append('text')
            .attr('x', x(2028) - 8)
            .attr('y', y(70) - 12)
            .attr('text-anchor', 'end')
            .style('fill', '#6b8f7e')
            .style('font-weight', '600')
            .style('font-family', 'var(--font-mono, monospace)')
            .style('font-size', '11px')
            .text('$5.4B Saved')
            .style('opacity', 0)
            .transition()
            .delay(1800)
            .duration(400)
            .style('opacity', 1);
    }

    useEffect(() => {
        renderTransitChart();
        renderCostChart();
    }, []);

    return (
        <div className="flex flex-col gap-3">
            {/* Transit Time Chart */}
            <motion.div
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-5"
            >
                <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400/70" strokeWidth={1.2} />
                    <h3 className="text-sm font-semibold text-white tracking-tight">Transit Time Analysis</h3>
                </div>
                <p className="text-[11px] text-zinc-500 mb-4 font-mono">
                    IMEC bypasses the 20-30 day Suez loop → 12-15 day optimal window
                </p>
                <div className="w-full flex justify-center items-center h-40">
                    <svg ref={transitChartRef} />
                </div>
                {/* Big metric */}
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white tabular-nums tracking-tight">-40%</span>
                    <span className="text-xs text-zinc-500 font-mono">transit time reduction</span>
                </div>
            </motion.div>

            {/* Cost Reduction Chart */}
            <motion.div
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-5"
            >
                <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-blue-400/70" strokeWidth={1.2} />
                    <h3 className="text-sm font-semibold text-white tracking-tight">Logistics Cost Reduction</h3>
                </div>
                <p className="text-[11px] text-zinc-500 mb-4 font-mono">
                    30% cost reduction → $5.4B projected annual systemic savings
                </p>
                <div className="w-full flex justify-center items-center h-40">
                    <svg ref={costChartRef} />
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white tabular-nums tracking-tight">-30%</span>
                    <span className="text-xs text-zinc-500 font-mono">logistics cost reduction</span>
                </div>
            </motion.div>
        </div>
    );
}
