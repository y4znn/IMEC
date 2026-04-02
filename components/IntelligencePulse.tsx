export default function IntelligencePulse() {
    return (
        <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-1000 fill-mode-forwards delay-500 opacity-0 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-1">
                <div className="text-[10px] font-mono text-gray-500 tracking-wider uppercase">
                    GLOBAL INTELLIGENCE VOLUME
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="text-lg font-sans font-bold text-gray-900 tracking-tight">
                        6,130,000+ Results
                    </div>
                </div>
                <div className="text-xs text-gray-400 font-sans mt-0.5">
                    Indexed across global strategic databases.
                </div>
            </div>
        </div>
    );
}
