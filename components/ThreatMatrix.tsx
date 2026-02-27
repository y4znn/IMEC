'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Eye,
    ShieldAlert,
    Handshake,
    Ship,
    Landmark,
} from 'lucide-react';

type MatrixEntry = {
    label: string;
    detail: string;
    severity: 'favorable' | 'adverse' | 'monitoring';
    icon: React.ReactNode;
};

const MATRIX: MatrixEntry[] = [
    {
        label: 'India-UAE Trade Expansion',
        detail: '$84.5B bilateral trade in 2023. CEPA driving 16% YoY growth. Port infrastructure expanding.',
        severity: 'favorable',
        icon: <TrendingUp className="w-4 h-4" strokeWidth={1.2} />,
    },
    {
        label: 'Gaza Conflict Impact',
        detail: 'Saudi-Israel normalization stalled. Northern rail segment through Israel faces political risk.',
        severity: 'adverse',
        icon: <ShieldAlert className="w-4 h-4" strokeWidth={1.2} />,
    },
    {
        label: 'EU Suez Diversification',
        detail: 'Houthi attacks on Red Sea shipping increased EU strategic interest in alternative corridors.',
        severity: 'favorable',
        icon: <Ship className="w-4 h-4" strokeWidth={1.2} />,
    },
    {
        label: 'BRI Competition',
        detail: 'Iraq Development Road ($17B) announced as Chinese-backed counter-corridor. Turkey-Iraq rail link accelerating.',
        severity: 'adverse',
        icon: <AlertTriangle className="w-4 h-4" strokeWidth={1.2} />,
    },
    {
        label: 'Saudi Normalization Timeline',
        detail: 'MBS signals conditional willingness. Palestinian statehood precondition remains unresolved.',
        severity: 'monitoring',
        icon: <Eye className="w-4 h-4" strokeWidth={1.2} />,
    },
    {
        label: 'Blue-Raman Cable Operational',
        detail: 'India-Israel-France subsea cable operational. Digital connectivity layer of IMEC now live.',
        severity: 'favorable',
        icon: <Handshake className="w-4 h-4" strokeWidth={1.2} />,
    },
    {
        label: 'Infrastructure Funding Gap',
        detail: 'Estimated $8-20B needed. No binding commitments yet. G20 working group deliberating mechanisms.',
        severity: 'monitoring',
        icon: <Landmark className="w-4 h-4" strokeWidth={1.2} />,
    },
    {
        label: 'Suez Transit Cost Escalation',
        detail: 'Suez Canal transit fees increased 15%. Insurance premiums for Red Sea route up 300% since Oct 2023.',
        severity: 'adverse',
        icon: <TrendingDown className="w-4 h-4" strokeWidth={1.2} />,
    },
];

const severityConfig = {
    favorable: {
        border: 'border-zinc-800/40',
        bg: 'bg-zinc-950/30',
        dot: 'bg-emerald-600/60',
        text: 'text-emerald-600/70',
        label: 'Favorable',
    },
    adverse: {
        border: 'border-zinc-800/40',
        bg: 'bg-zinc-950/30',
        dot: 'bg-red-500/50',
        text: 'text-red-500/60',
        label: 'Adverse',
    },
    monitoring: {
        border: 'border-zinc-800/40',
        bg: 'bg-zinc-950/30',
        dot: 'bg-amber-500/50',
        text: 'text-amber-500/60',
        label: 'Monitoring',
    },
};

export default function PolicyMatrix() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-zinc-800/40 bg-zinc-950/40 overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-zinc-800/40 flex items-center justify-between">
                <h2 className="text-[12px] font-semibold text-zinc-400 tracking-tight">
                    Geopolitical Consequences
                </h2>
                <div className="flex items-center gap-2.5">
                    {(['favorable', 'adverse', 'monitoring'] as const).map((s) => (
                        <span key={s} className="flex items-center gap-1">
                            <span className={`w-1 h-1 rounded-full ${severityConfig[s].dot}`} />
                            <span className={`text-[9px] ${severityConfig[s].text}`}>
                                {severityConfig[s].label}
                            </span>
                        </span>
                    ))}
                </div>
            </div>

            {/* Cards — compact 2-column grid */}
            <div className="p-2.5 grid grid-cols-2 lg:grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto">
                {MATRIX.map((entry, i) => {
                    const config = severityConfig[entry.severity];
                    return (
                        <motion.div
                            key={entry.label}
                            initial={{ opacity: 0, y: 6 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 + i * 0.03, duration: 0.25 }}
                            className={`p-2.5 rounded-lg border ${config.border} ${config.bg} cursor-default transition-all duration-200 hover:border-zinc-700/40`}
                        >
                            <div className="flex items-start gap-2">
                                <span className={`${config.text} mt-0.5 flex-shrink-0 opacity-70`}>
                                    {entry.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[11px] font-medium text-zinc-300 leading-tight tracking-tight mb-0.5">
                                        {entry.label}
                                    </h3>
                                    <p className="text-[10px] text-zinc-600 leading-snug line-clamp-2">
                                        {entry.detail}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
