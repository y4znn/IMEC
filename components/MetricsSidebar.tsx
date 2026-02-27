'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    DollarSign,
    AlertTriangle,
    TrendingDown,
    Route,
    Ship,
    Cable,
} from 'lucide-react';

type MetricCard = {
    icon: React.ReactNode;
    label: string;
    value: string;
    unit: string;
    detail: string;
    accent: string;
    accentBorder: string;
};

const METRICS: MetricCard[] = [
    {
        icon: <Clock className="w-4 h-4" strokeWidth={1.2} />,
        label: 'IMEC Efficiency',
        value: '-40%',
        unit: 'transit time',
        detail: '12-15 days via IMEC vs. 20-30 days via Suez Canal maritime route.',
        accent: 'text-cyan-400',
        accentBorder: 'border-cyan-500/15',
    },
    {
        icon: <DollarSign className="w-4 h-4" strokeWidth={1.2} />,
        label: 'Economic Impact',
        value: '$5.4B',
        unit: 'annual savings',
        detail: 'Projected savings with 30% logistics cost decrease across corridor.',
        accent: 'text-emerald-400',
        accentBorder: 'border-emerald-500/15',
    },
    {
        icon: <AlertTriangle className="w-4 h-4" strokeWidth={1.2} />,
        label: 'Infrastructure Gap',
        value: '$5B',
        unit: 'funding deficit',
        detail: 'Jordan-Israel rail segment remains the critical unfunded bottleneck.',
        accent: 'text-amber-400',
        accentBorder: 'border-amber-500/15',
    },
    {
        icon: <TrendingDown className="w-4 h-4" strokeWidth={1.2} />,
        label: 'Suez Risk Premium',
        value: '+300%',
        unit: 'insurance cost',
        detail: 'Red Sea insurance premiums surged since Oct 2023 Houthi disruptions.',
        accent: 'text-red-400',
        accentBorder: 'border-red-500/15',
    },
    {
        icon: <Cable className="w-4 h-4" strokeWidth={1.2} />,
        label: 'Digital Layer',
        value: 'ACTIVE',
        unit: 'Blue-Raman Cable',
        detail: 'India-Israel-France subsea cable operational. Bypasses Egypt data chokepoint.',
        accent: 'text-purple-400',
        accentBorder: 'border-purple-500/15',
    },
    {
        icon: <Route className="w-4 h-4" strokeWidth={1.2} />,
        label: 'DRP Competitor',
        value: '$17B',
        unit: 'rival corridor',
        detail: 'Iraq-Turkey Development Road. Chinese-backed counter to IMEC.',
        accent: 'text-amber-400',
        accentBorder: 'border-amber-500/15',
    },
];

const CORRIDORS = [
    { name: 'IMEC', color: 'bg-cyan-400', nodes: 'India → UAE → Saudi → Israel → Europe' },
    { name: 'Blue-Raman', color: 'bg-purple-500', nodes: 'India → Oman → Saudi → Israel → Italy' },
    { name: 'DRP', color: 'bg-amber-500', nodes: 'Iraq (Al Faw) → Turkey → Europe' },
    { name: 'INSTC', color: 'bg-red-500', nodes: 'India → Iran → Caspian → Russia' },
];

export default function MetricsSidebar() {
    return (
        <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
            {/* ── Corridor Routes Summary ── */}
            <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-4"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Ship className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.2} />
                    <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">
                        Active Corridors
                    </span>
                </div>
                <div className="space-y-2">
                    {CORRIDORS.map((c) => (
                        <div key={c.name} className="flex items-start gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${c.color} mt-1.5 flex-shrink-0`} />
                            <div>
                                <span className="text-[11px] font-semibold text-zinc-300 tracking-tight">{c.name}</span>
                                <p className="text-[10px] text-zinc-600 font-mono leading-tight">{c.nodes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── Metric Cards ── */}
            {METRICS.map((metric, i) => (
                <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
                    className={`rounded-xl border ${metric.accentBorder} bg-white/[0.02] backdrop-blur-xl p-4 group cursor-default transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-0.5`}
                >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`${metric.accent} opacity-60`}>{metric.icon}</span>
                        <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">
                            {metric.label}
                        </span>
                    </div>

                    {/* Big number — pure white for primary metrics */}
                    <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                            {metric.value}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">{metric.unit}</span>
                    </div>

                    {/* Detail */}
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                        {metric.detail}
                    </p>
                </motion.div>
            ))}
        </div>
    );
}
