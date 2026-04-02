'use client';

import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isMapPage = pathname === '/maps';

    return (
        <div
            className={`w-full h-full min-h-[85vh] rounded-xl border shadow-2xl ${isMapPage
                ? 'bg-transparent border-transparent shadow-none'
                : 'bg-white border-gray-200 backdrop-blur-xl p-6 lg:p-8'
                }`}
        >
            {children}
        </div>
    );
}
