'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'warning' | 'info' | 'error';
    onDismiss: () => void;
}

export default function Toast({ message, type = 'warning', onDismiss }: ToastProps) {
    const [exiting, setExiting] = useState(false);

    const handleDismiss = () => {
        setExiting(true);
        setTimeout(onDismiss, 250);
    };

    useEffect(() => {
        const timer = setTimeout(() => handleDismiss(), 8000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const styles = {
        warning: 'bg-amber-950/90 border-amber-700/50 text-amber-200',
        info: 'bg-blue-950/90 border-blue-700/50 text-blue-200',
        error: 'bg-red-950/90 border-red-700/50 text-red-200',
    };

    const iconColor = {
        warning: 'text-amber-400',
        info: 'text-blue-400',
        error: 'text-red-400',
    };

    return (
        <div className={`fixed top-20 right-6 z-[100] max-w-md ${exiting ? 'toast-exit' : 'toast-enter'}`}>
            <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-xl ${styles[type]}`}>
                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor[type]}`} strokeWidth={1.5} />
                <p className="text-[13px] leading-relaxed flex-1">{message}</p>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Dismiss notification"
                >
                    <X className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}
