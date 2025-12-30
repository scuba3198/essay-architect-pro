import React, { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const TourTooltip = ({ stepIndex, currentStep, onNext, onSkip, text, position = "bottom" }) => {
    const anchorRef = useRef(null);
    const [coords, setCoords] = useState(null);

    // Update position on mount, resize, scroll, and when step changes
    useLayoutEffect(() => {
        if (currentStep !== stepIndex) return;

        const updatePosition = () => {
            if (anchorRef.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                const scrollX = window.scrollX;
                const scrollY = window.scrollY;

                // Basic center positioning
                let top = 0;
                let left = 0;

                // Adjust based on requested position
                switch (position) {
                    case 'bottom':
                        top = rect.bottom + window.scrollY + 24; // mt-6 = 24px
                        left = rect.left + (rect.width / 2) + window.scrollX;
                        break;
                    case 'top':
                        top = rect.top + window.scrollY - 24;
                        left = rect.left + (rect.width / 2) + window.scrollX;
                        break;
                    case 'left':
                        top = rect.top + (rect.height / 2) + window.scrollY;
                        left = rect.left + window.scrollX - 24;
                        break;
                    case 'right':
                        top = rect.top + (rect.height / 2) + window.scrollY;
                        left = rect.right + window.scrollX + 24;
                        break;
                    case 'bottomLeft':
                        top = rect.bottom + window.scrollY + 24;
                        left = rect.right + window.scrollX; // Align to right edge
                        break;
                    case 'bottomRight':
                        top = rect.bottom + window.scrollY + 24;
                        left = rect.left + window.scrollX; // Align to left edge
                        break;
                    default:
                        // Default to bottom
                        top = rect.bottom + window.scrollY + 24;
                        left = rect.left + (rect.width / 2) + window.scrollX;
                }

                setCoords({ top, left });
            }
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // Capture for scrolling in containers

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [currentStep, stepIndex, position]);

    // Always render the anchor
    if (currentStep !== stepIndex) {
        return <div ref={anchorRef} className="hidden" />;
    }

    // Portal content
    const tooltipContent = (
        <div
            className="fixed z-[100] w-72 bg-yellow-400 border-2 border-stone-900 text-stone-900 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] p-0 animate-in fade-in zoom-in duration-300"
            style={{
                top: coords?.top,
                left: coords?.left,
                transform: position === 'left' || position === 'right' ? 'translateY(-50%)'
                    : position === 'bottomLeft' ? 'translateX(-100%)' // Align right edge
                        : position === 'bottomRight' ? 'translateX(0)'
                            : 'translateX(-50%)' // Center by default
            }}
        >
            {/* Connector Line */}
            <div className={`absolute bg-stone-900
                ${position === 'bottom' ? '-top-6 left-1/2 w-0.5 h-6 -translate-x-1/2' : ''}
                ${position === 'top' ? '-bottom-6 left-1/2 w-0.5 h-6 -translate-x-1/2' : ''}
                ${position === 'left' ? '-right-6 top-1/2 h-0.5 w-6 -translate-y-1/2' : ''}
                ${position === 'right' ? '-left-6 top-1/2 h-0.5 w-6 -translate-y-1/2' : ''}
                ${position === 'bottomLeft' ? '-top-6 right-6 w-0.5 h-6' : ''} 
                ${position === 'bottomRight' ? '-top-6 left-6 w-0.5 h-6' : ''}
            `} />

            <div className="relative z-10 p-5">
                <div className="flex gap-3 mb-3 items-start">
                    <div className="bg-stone-900 text-white w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold border border-stone-900">
                        {stepIndex + 1}
                    </div>
                    <p className="text-sm font-bold font-serif leading-tight">{text}</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-stone-900/20 mt-1">
                    <button onClick={onSkip} className="text-stone-700 hover:text-stone-900 text-xs font-bold uppercase tracking-wider underline decoration-1 underline-offset-2">End Tour</button>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-stone-600 font-mono">{stepIndex + 1}/4</span>
                        <button
                            onClick={onNext}
                            className="bg-stone-900 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-stone-900 transition-colors border border-stone-900"
                        >
                            {stepIndex === 3 ? "Finish" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div ref={anchorRef} className="absolute inset-0 pointer-events-none" />
            {coords && createPortal(tooltipContent, document.body)}
        </>
    );
};

export default TourTooltip;
