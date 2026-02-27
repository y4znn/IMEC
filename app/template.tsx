'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isMapPage = pathname === '/maps';

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full h-full min-h-[85vh] rounded-xl border shadow-2xl ${isMapPage
                    ? 'bg-transparent border-transparent shadow-none'
                    : 'bg-white/[0.02] border-white/[0.05] backdrop-blur-xl p-6 lg:p-8'
                    }`}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
