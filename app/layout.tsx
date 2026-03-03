'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { DefenseProvider } from '@/components/DefenseContext';
import CRTOverlay from '@/components/CRTOverlay';

const fraunces = Fraunces({
    subsets: ['latin'],
    variable: '--font-fraunces',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains-mono',
});

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
                <title>India Middle East Europe Economic Corridor Research Platform</title>
                <meta name="description" content="PhD Research Platform — India-Middle East-Europe Economic Corridor Analysis" />
            </head>
            <body className={`min-h-screen bg-gray-50 text-gray-900 ${fraunces.variable} ${jetbrainsMono.variable} font-serif antialiased overflow-x-hidden`}>
                <DefenseProvider>
                    {/* ── Persistent 3D Globe Background ── */}
                    <div className="fixed inset-0 z-0 pointer-events-auto bg-gray-50">
                        <PersistentGlobe />
                    </div>

                    {/* ── Navigation Bar ── */}
                    <header className="fixed top-0 inset-x-0 z-50 bg-gray-50 border-b border-gray-300">
                        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                            <Link href="/" className="flex flex-col group py-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1.5 h-1.5 bg-white rounded-none" />
                                    <span className="text-[13px] font-semibold text-gray-800 tracking-tight group-hover:text-gray-900 transition-colors duration-300 chromatic-text">
                                        India Middle East Europe Economic Corridor Research Platform
                                    </span>
                                </div>
                                <div className="pl-4 mt-0.5">
                                    <span className="text-[9px] font-mono text-gray-600 tracking-widest uppercase opacity-80">
                                        <a href="https://www.linkedin.com/in/ahmadghsnn" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">A Phd Project by Ahmad Ghosn</a>
                                    </span>
                                </div>
                            </Link>

                            <nav className="flex items-center gap-2" aria-label="Primary navigation">
                                <NavLink href="/sources" label="Sources" current={pathname} />
                                <NavLink href="/maps" label="Corridors map" current={pathname} />
                                <NavLink href="/profile" label="Researcher Profile" current={pathname} />
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
                        <footer className="relative z-10 border-t border-gray-300 bg-gray-50">
                            <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-gray-500 font-mono">
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
                ? 'text-gray-900 border-gray-300 bg-gray-200'
                : 'text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
            style={{ borderRadius: 0 }}
        >
            {label}
        </Link>
    );
}
