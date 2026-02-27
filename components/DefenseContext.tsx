'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type SceneDefinition = {
    index: number;
    title: string;
    cameraPos: [number, number, number];
    cameraTarget: [number, number, number]; // Look at target
    blurGlobe: boolean; // Should the globe be blurred?
};

export const DEFENSE_SCENES: SceneDefinition[] = [
    {
        index: 0,
        title: 'Overview',
        cameraPos: [0, 0.8, 4.5],
        cameraTarget: [0, 0, 0],
        blurGlobe: true,
    },
    {
        index: 1,
        title: 'IMEC Backbone',
        cameraPos: [1.8, 1.2, 2.8],
        cameraTarget: [1.2, 0.5, 1.2], // Focused on Middle East
        blurGlobe: false,
    },
    {
        index: 2,
        title: 'Threat Vectors',
        cameraPos: [0.8, 0.2, 3.2],
        cameraTarget: [0.5, 0.1, 1.5], // Focused on Bab el-Mandeb / Red Sea
        blurGlobe: false,
    },
    {
        index: 3,
        title: 'Rival Corridors',
        cameraPos: [1.2, 1.8, 2.5],
        cameraTarget: [0.8, 1.0, 1.0], // Focused on Turkey / Iran
        blurGlobe: false,
    },
    {
        index: 4,
        title: 'Digital Layer',
        cameraPos: [2.0, 0.5, 3.0],
        cameraTarget: [1.5, 0.2, 1.0], // Focused on Blue-Raman route
        blurGlobe: false,
    },
];

interface DefenseContextType {
    isDefenseMode: boolean;
    currentScene: number;
    sceneData: SceneDefinition;
    nextScene: () => void;
    prevScene: () => void;
}

const DefenseContext = createContext<DefenseContextType | undefined>(undefined);

export function DefenseProvider({ children }: { children: ReactNode }) {
    const [isDefenseMode, setIsDefenseMode] = useState(false);
    const [currentScene, setCurrentScene] = useState(0);

    const pathname = usePathname();

    // Toggle Defense Mode with Cmd+D (or Ctrl+D)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                setIsDefenseMode((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle Spacebar / Arrow keys in Defense Mode
    useEffect(() => {
        if (!isDefenseMode) return;

        const handleNavigation = (e: KeyboardEvent) => {
            // Prevent scrolling on Space if we are intercepting it
            if (e.key === ' ' || e.key === 'ArrowRight') {
                e.preventDefault();
                setCurrentScene((prev) => Math.min(prev + 1, DEFENSE_SCENES.length - 1));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentScene((prev) => Math.max(prev - 1, 0));
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isDefenseMode]);

    // Reset scene when defense mode exits
    useEffect(() => {
        if (!isDefenseMode) {
            setTimeout(() => setCurrentScene(0), 0);
        }
    }, [isDefenseMode]);

    // Derived blur state: always true if NOT defense mode AND on non-map pages
    const isMapPage = pathname === '/maps';
    const activeBlur = isDefenseMode
        ? DEFENSE_SCENES[currentScene].blurGlobe
        : !isMapPage;

    const contextValue = {
        isDefenseMode,
        currentScene,
        sceneData: { ...DEFENSE_SCENES[currentScene], blurGlobe: activeBlur },
        nextScene: () => setCurrentScene((prev) => Math.min(prev + 1, DEFENSE_SCENES.length - 1)),
        prevScene: () => setCurrentScene((prev) => Math.max(prev - 1, 0)),
    };

    return (
        <DefenseContext.Provider value={contextValue}>
            {children}
            {/* Defense Mode HUD */}
            {isDefenseMode && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-zinc-950/90 backdrop-blur-md border border-emerald-500/30 px-4 py-2 rounded-full pointer-events-none shadow-2xl shadow-emerald-500/10">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">
                        Defense Mode Active
                    </span>
                    <div className="h-4 w-px bg-white/10" />
                    <span className="text-[11px] font-mono text-zinc-300">
                        Scene {currentScene + 1}/5: {DEFENSE_SCENES[currentScene].title}
                    </span>
                    <div className="h-4 w-px bg-white/10" />
                    <span className="text-[10px] font-mono text-zinc-500">
                        [SPACE] or [→] to advance
                    </span>
                </div>
            )}
        </DefenseContext.Provider>
    );
}

export function useDefenseMode() {
    const context = useContext(DefenseContext);
    if (context === undefined) {
        throw new Error('useDefenseMode must be used within a DefenseProvider');
    }
    return context;
}
