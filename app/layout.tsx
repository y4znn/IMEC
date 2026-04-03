'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Fraunces, JetBrains_Mono } from 'next/font/google';
import { Menu, X } from 'lucide-react';
import './globals.css';
import { DefenseProvider } from '@/components/DefenseContext';
import CRTOverlay from '@/components/CRTOverlay';
import { NewsletterForm } from '@/components/NewsletterForm';

const fraunces = Fraunces({
    subsets: ['latin'],
    variable: '--font-fraunces',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains-mono',
});

const PersistentMap = dynamic(() => import('@/components/NarrativeMap'), {
    ssr: false,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isMapPage = pathname === '/maps';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <html lang="en">
            <head>
                {/* Google tag (gtag.js) */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-LSVJ1S8EDX"></script>
                <script dangerouslySetInnerHTML={{ __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', 'G-LSVJ1S8EDX');
                ` }} />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <title>IMEC Radar</title>
                <meta name="description" content="IMEC Radar Intelligence Platform — India-Middle East-Europe Economic Corridor Analysis" />
            </head>
            <body className={`min-h-screen bg-gray-50 text-gray-900 ${fraunces.variable} ${jetbrainsMono.variable} font-serif antialiased overflow-x-hidden`}>
                <DefenseProvider>
                    {/* ── Persistent 2D Map Background ── */}
                    <div className="fixed inset-0 z-0 pointer-events-auto bg-gray-50">
                        <PersistentMap />
                    </div>

                    {/* ── Navigation Bar ── */}
                    <header className="relative z-50 bg-gray-50 border-b border-gray-300">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-1.5 pb-1 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="flex flex-col py-0 min-w-0 flex-1">
                                <Link href="/" className="group inline-block">
                                    <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tighter leading-tight text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out fill-mode-forwards">
                                        IMEC Radar
                                    </h1>
                                </Link>
                                <div className="mt-0 hidden sm:block">
                                    <span className="text-[11px] font-sans text-gray-600 tracking-widest uppercase opacity-80 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
                                        <a href="https://www.linkedin.com/in/ahmadghsnn" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">a project by ahmad ghosn</a>
                                    </span>
                                </div>
                            </div>

                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex items-center gap-2 mb-0.5" aria-label="Primary navigation">
                                <NavLink href="/sources" label="Sources" current={pathname} />
                                <NavLink href="/maps" label="Corridors map" current={pathname} />
                                <NavLink href="/profile" label="Researcher Profile" current={pathname} />
                            </nav>

                            {/* Mobile Menu Button */}
                            <button
                                className="md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors absolute top-6 right-4"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* Mobile Navigation Menu */}
                        {mobileMenuOpen && (
                            <nav className="md:hidden border-t border-gray-300 bg-gray-50 px-4 py-3 flex flex-col gap-1 absolute top-full left-0 right-0 z-50 shadow-xl" aria-label="Mobile navigation">
                                <MobileNavLink href="/sources" label="Sources" current={pathname} onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/maps" label="Corridors map" current={pathname} onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/profile" label="Researcher Profile" current={pathname} onClick={() => setMobileMenuOpen(false)} />
                            </nav>
                        )}
                    </header>

                    {/* ── Page Content ── */}
                    <CRTOverlay />
                    <main className={`relative z-10 min-h-screen pt-6 pb-12 md:pb-16 ${isMapPage ? 'pointer-events-none' : ''}`}>
                        <div className={`max-w-7xl mx-auto px-4 md:px-6 ${isMapPage ? 'pointer-events-none' : ''}`}>
                            {children}
                        </div>
                    </main>

                    {/* ── Footer ── */}
                    <footer className={`relative z-10 border-t border-gray-300 bg-gray-50 ${isMapPage ? 'md:hidden' : ''}`}>
                        {/* Newsletter Section */}
                        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 border-b border-gray-200">
                            <div className="max-w-md">
                                <NewsletterForm />
                            </div>
                        </div>
                        {/* Footer Info */}
                        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 font-mono text-center sm:text-left">
                            <span className="text-[10px] sm:text-xs">Sources: Atlantic Council · ECFR · CSIS · Brookings</span>
                        </div>
                    </footer>
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

function MobileNavLink({ href, label, current, onClick }: { href: string; label: string; current: string; onClick: () => void }) {
    const isActive = current === href;
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`px-4 py-3 text-[12px] font-mono tracking-widest uppercase transition-all duration-200 border-l-2 ${isActive
                ? 'text-gray-900 bg-gray-100 border-gray-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-transparent'
                }`}
        >
            {label}
        </Link>
    );
}
