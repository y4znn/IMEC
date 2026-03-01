'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import './globals.css';
import { DefenseProvider } from '@/components/DefenseContext';
import CRTOverlay from '@/components/CRTOverlay';

const PersistentGlobe = dynamic(() => import('@/components/GlobeView'), {
    ssr: false,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isMapPage = pathname === '/maps';

    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
                <title>India Middle East Europe Economic Corridor Research Platform</title>
                <meta name="description" content="PhD Research Platform — India-Middle East-Europe Economic Corridor Analysis" />
            </head>
            <body className="min-h-screen bg-black text-white font-serif antialiased overflow-x-hidden">
                <DefenseProvider>
                    {/* ── Persistent 3D Globe Background ── */}
                    <div className="fixed inset-0 z-0 pointer-events-auto bg-black">
                        <PersistentGlobe />
                    </div>

                    {/* ── Navigation Bar ── */}
                    <header className="fixed top-0 inset-x-0 z-50 bg-black border-b border-white/20">
                        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                            <Link href="/" className="flex flex-col group py-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1.5 h-1.5 bg-white rounded-none" />
                                    <span className="text-[13px] font-semibold text-zinc-200 tracking-tight group-hover:text-white transition-colors duration-300 chromatic-text">
                                        India Middle East Europe Economic Corridor Research Platform
                                    </span>
                                </div>
                                <div className="pl-4 mt-0.5">
                                    <span className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase opacity-80">
                                        TRACE: / {pathname === '/' ? 'DATA_NEXUS/Z-STACK' : pathname === '/maps' ? 'GEOSPATIAL/CORRIDORS' : pathname === '/dossier' ? 'INVESTIGATOR/DOSSIER' : 'DATABASE/REFERENCES'}
                                    </span>
                                </div>
                            </Link>

                            <nav className="flex items-center gap-2" aria-label="Primary navigation">
                                <NavLink href="/" label="Network Graph" current={pathname} />
                                <NavLink href="/maps" label="Corridors Map" current={pathname} />
                                <NavLink href="/dossier" label="Researcher profile" current={pathname} />
                                <NavLink href="/sources" label="Sources and references" current={pathname} />
                            </nav>
                        </div>
                    </header>

                    {/* ── Page Content ── */}
                    <CRTOverlay />
                    <main className={`relative z-10 min-h-screen pt-20 pb-16 ${isMapPage ? 'pointer-events-none' : ''}`}>
                        <div className={`max-w-7xl mx-auto px-6 ${isMapPage ? 'pointer-events-none' : ''}`}>
                            {children}
                        </div>
                    </main>

                    {/* ── Footer ── */}
                    {!isMapPage && (
                        <footer className="relative z-10 border-t border-white/20 bg-black">
                            <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-zinc-500 font-mono">
                                <span>Ahmad Ghosn · PhD Research Platform</span>
                                <span>Sources: Atlantic Council · ECFR · CSIS · Brookings</span>
                            </div>
                        </footer>
                    )}
                </DefenseProvider>
            </body>
        </html>
    );
}

function NavLink({ href, label, current }: { href: string; label: string; current: string }) {
    const isActive = current === href;
    return (
        <Link
            href={href}
            className={`px-3.5 py-1.5 text-[11px] font-mono tracking-widest uppercase transition-all duration-200 cursor-pointer border border-transparent ${isActive
                ? 'text-white border-white/20 bg-white/5'
                : 'text-zinc-500 hover:text-white hover:border-white/20'
                }`}
            style={{ borderRadius: 0 }}
        >
            {label}
        </Link>
    );
}
