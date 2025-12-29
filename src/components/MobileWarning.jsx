import React, { useState, useEffect } from 'react';
import { Monitor, X, Smartphone } from 'lucide-react';

const MobileWarning = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            // Show warning if width is less than 1024px (tablet/mobile)
            setIsVisible(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-x-0 bottom-4 z-[100] px-4 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-md mx-auto bg-yellow-400 border-4 border-stone-900 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] p-6 relative">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-4 -right-4 bg-stone-900 text-white p-2 border-2 border-stone-900 hover:bg-white hover:text-stone-900 transition-colors"
                    aria-label="Close warning"
                >
                    <X size={16} strokeWidth={3} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="bg-stone-900 text-white p-3 shrink-0 border-2 border-stone-900">
                        <Monitor size={24} strokeWidth={3} />
                    </div>

                    <div>
                        <h3 className="font-black text-stone-900 uppercase tracking-tighter text-lg leading-none mb-2">
                            Architectural Alert
                        </h3>
                        <p className="text-stone-900 font-bold text-xs uppercase leading-tight tracking-wide">
                            This workspace is optimized for larger screens. For the full Architect experience, please switch to a Desktop.
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 w-full bg-stone-900/10 border-2 border-stone-900 overflow-hidden">
                        <div className="h-full bg-stone-900 w-1/3"></div>
                    </div>
                    <Smartphone size={14} className="text-stone-900 shrink-0" />
                </div>
            </div>
        </div>
    );
};

export default MobileWarning;
