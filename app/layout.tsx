'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import './globals.css';
import { DefenseProvider } from '@/components/DefenseContext';

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
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet" />
                <title>IMEC Research Platform — Corridor Intelligence</title>
                <meta name="description" content="PhD Research Platform — India-Middle East-Europe Economic Corridor Analysis" />
            </head>
            <body className="min-h-screen bg-black text-zinc-400 font-sans antialiased overflow-x-hidden">
                <DefenseProvider>
                    {/* ── Persistent 3D Globe Background ── */}
                    <div className="fixed inset-0 z-0 pointer-events-auto bg-black">
                        <PersistentGlobe />
                    </div>

                    {/* ── Subtle gradient overlay ── */}
                    <div
                        className="fixed inset-0 z-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(30, 64, 175, 0.04) 0%, transparent 70%)',
                        }}
                    />

                    {/* ── Navigation Bar ── */}
                    <header className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-lg border-b border-zinc-800/40">
                        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2.5 group">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                <span className="text-[13px] font-semibold text-zinc-200 tracking-tight group-hover:text-zinc-100 transition-colors duration-300">
                                    IMEC Research Platform
                                </span>
                            </Link>

                            <nav className="flex items-center gap-1" aria-label="Primary navigation">
                                <NavLink href="/" label="Policy Aggregator" current={pathname} />
                                <NavLink href="/maps" label="Geospatial" current={pathname} />
                                <NavLink href="/dossier" label="Investigator" current={pathname} />
                            </nav>
                        </div>
                    </header>

                    {/* ── Page Content ── */}
                    <main className={`relative z-10 min-h-screen pt-20 pb-16 ${isMapPage ? 'pointer-events-none' : ''}`}>
                        <div className={`max-w-7xl mx-auto px-6 ${isMapPage ? 'pointer-events-none' : ''}`}>
                            {children}
                        </div>
                    </main>

                    {/* ── Footer ── */}
                    {!isMapPage && (
                        <footer className="relative z-10 border-t border-zinc-800/40 bg-black/90 backdrop-blur-lg">
                            <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-zinc-600">
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
            className={`px-3.5 py-1.5 text-[13px] rounded-lg transition-all duration-200 cursor-pointer ${isActive
                ? 'text-zinc-200 bg-zinc-900/60 font-medium'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                }`}
        >
            {label}
        </Link>
    );
}
