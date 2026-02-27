'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Database, Globe, CheckCircle } from 'lucide-react';

type NodeStatus = {
    name: string;
    status: 'operational' | 'limited' | 'inactive';
};

const CORRIDOR_NODES: NodeStatus[] = [
    { name: 'Mundra', status: 'operational' },
    { name: 'Fujairah', status: 'operational' },
    { name: 'Jebel Ali', status: 'operational' },
    { name: 'Riyadh', status: 'limited' },
    { name: 'Haifa', status: 'inactive' },
    { name: 'Piraeus', status: 'operational' },
    { name: 'Marseille', status: 'operational' },
];

const statusColor = {
    operational: 'bg-emerald-600/60',
    limited: 'bg-amber-600/60',
    inactive: 'bg-zinc-600',
};

export default function StatusBar() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setTime(
                now.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'UTC',
                }) + ' UTC'
            );
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    const operational = CORRIDOR_NODES.filter((n) => n.status === 'operational').length;
    const total = CORRIDOR_NODES.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 rounded-xl border border-zinc-800/40 bg-zinc-950/40 text-[12px]"
        >
            <span className="flex items-center gap-1.5 text-zinc-500">
                <Clock className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.2} />
                <span className="tabular-nums font-mono text-[11px]">{time}</span>
            </span>

            <span className="w-px h-3 bg-zinc-800/60 hidden sm:block" />

            <span className="flex items-center gap-1.5 text-zinc-500">
                <Database className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.2} />
                <span>12 peer-reviewed sources</span>
            </span>

            <span className="w-px h-3 bg-zinc-800/60 hidden sm:block" />

            <span className="flex items-center gap-1.5 text-zinc-500">
                <Globe className="w-3.5 h-3.5 text-zinc-600" strokeWidth={1.2} />
                <span>Corridor Nodes {operational}/{total}</span>
                <span className="flex items-center gap-0.5 ml-1">
                    {CORRIDOR_NODES.map((node) => (
                        <span
                            key={node.name}
                            title={`${node.name}: ${node.status}`}
                            className={`w-1.5 h-1.5 rounded-full ${statusColor[node.status]}`}
                        />
                    ))}
                </span>
            </span>

            <span className="ml-auto hidden md:flex items-center gap-1.5 text-zinc-600">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-700/70" strokeWidth={1.2} />
                <span>Data pipeline active</span>
            </span>
        </motion.div>
    );
}
