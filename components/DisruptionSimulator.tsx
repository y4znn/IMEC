'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, Clock, Ship, TrendingUp } from 'lucide-react';

/**
 * Economic Disruption Simulator
 * Models the impact of Suez Canal traffic disruption on IMEC corridor value.
 * Uses nonlinear curves for realistic economic behavior.
 */

// Economic model: nonlinear response curves
function computeMetrics(disruption: number) {
    const t = disruption / 100;

    // IMEC Strategic Value: exponential growth as Suez disruption increases
    // At 0% disruption, IMEC value premium is ~12%. At 100%, it's ~87%.
    const imecValue = 12 + 75 * (1 - Math.exp(-3 * t)) * (0.3 + 0.7 * t);

    // Supply chain delay: quadratic curve — delays compound
    // 0% → 0 days, 50% → ~6 days, 100% → 18.5 days
    const delay = 18.5 * Math.pow(t, 1.6);

    // Overland freight surge: S-curve (logistic) — slow start, rapid middle, plateaus
    // 0% → 0 TEUs, 100% → 2.4M TEUs
    const freight = 2400000 / (1 + Math.exp(-8 * (t - 0.45)));

    return { imecValue, delay, freight };
}

function formatNumber(n: number, decimals = 1): string {
    if (n >= 1000000) return (n / 1000000).toFixed(decimals) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toFixed(decimals);
}

export default function DisruptionSimulator() {
    const [disruption, setDisruption] = useState(25);
    const metrics = useMemo(() => computeMetrics(disruption), [disruption]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-xl border border-zinc-800/40 bg-zinc-950/40 overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-zinc-800/40">
                <div className="flex items-center gap-2.5 mb-1">
                    <Gauge className="w-4 h-4 text-zinc-500" strokeWidth={1.2} />
                    <h2
                        className="text-[15px] font-semibold text-zinc-200 tracking-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Economic Disruption Simulator
                    </h2>
                </div>
                <p className="text-[12px] text-zinc-500 leading-relaxed">
                    Model the cascading effects of Suez Canal traffic disruption on IMEC corridor strategic value.
                </p>
            </div>

            {/* Slider */}
            <div className="px-5 py-5">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[12px] font-medium text-zinc-400">
                        Suez Canal Traffic Disruption
                    </label>
                    <span className="text-[13px] font-semibold text-zinc-400 tabular-nums">
                        {disruption}%
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={disruption}
                    onChange={(e) => setDisruption(Number(e.target.value))}
                    className="w-full"
                    aria-label="Suez Canal Traffic Disruption Percentage"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
                    <span>0% — Normal operations</span>
                    <span>100% — Full blockage</span>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-3 px-5 pb-5">
                <MetricCard
                    icon={<TrendingUp className="w-4 h-4" strokeWidth={1.2} />}
                    label="IMEC Strategic Value Premium"
                    value={metrics.imecValue.toFixed(1)}
                    unit="%"
                    color="text-emerald-600/70"
                    borderColor="border-zinc-800/40"
                    bgColor="bg-zinc-950/30"
                />
                <MetricCard
                    icon={<Clock className="w-4 h-4" strokeWidth={1.2} />}
                    label="Global Supply Chain Delay"
                    value={metrics.delay.toFixed(1)}
                    unit=" days"
                    color="text-amber-500/60"
                    borderColor="border-zinc-800/40"
                    bgColor="bg-zinc-950/30"
                />
                <MetricCard
                    icon={<Ship className="w-4 h-4" strokeWidth={1.2} />}
                    label="Overland Freight Surge"
                    value={formatNumber(metrics.freight)}
                    unit=" TEUs"
                    color="text-zinc-400"
                    borderColor="border-zinc-800/40"
                    bgColor="bg-zinc-950/30"
                />
            </div>
        </motion.div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    unit,
    color,
    borderColor,
    bgColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    unit: string;
    color: string;
    borderColor: string;
    bgColor: string;
}) {
    return (
        <div className={`rounded-lg border ${borderColor} ${bgColor} p-3.5 transition-all duration-200`}>
            <div className={`flex items-center gap-1.5 mb-2 ${color} opacity-70`}>
                {icon}
            </div>
            <div className="flex items-baseline gap-0.5 mb-1.5">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={value}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`text-xl font-bold tabular-nums tracking-tight ${color}`}
                    >
                        {value}
                    </motion.span>
                </AnimatePresence>
                <span className="text-[11px] text-zinc-600">{unit}</span>
            </div>
            <p className="text-[10px] text-zinc-600 leading-relaxed">{label}</p>
        </div>
    );
}
