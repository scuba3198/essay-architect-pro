import React, { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const TourTooltip = ({ stepIndex, currentStep, onNext, onSkip, text, position = "bottom", totalSteps = 6 }) => {
    const anchorRef = useRef(null);
    const [layout, setLayout] = useState(null);

    // Update position on mount, resize, scroll, and when step changes
    useLayoutEffect(() => {
        if (currentStep !== stepIndex) return;

        const updatePosition = () => {
            if (anchorRef.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                const TOOLTIP_WIDTH = 288; // w-72 = 18rem = 288px
                const PADDING = 16; // Screen edge padding

                let top = 0;
                let left = 0;
                let arrowLeft = 0;
                // let arrowTop = 0; // Not used in the new logic

                // Helper to clamp value
                const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

                const centerX = rect.left + (rect.width / 2);
                // const centerY = rect.top + (rect.height / 2); // Not used in the new logic

                // Determine Vertical Position (Top/Bottom) with auto-flip
                let isTop = position.toLowerCase().includes('top');

                // Preliminary calculation to check for overflow
                if (isTop) {
                    // Check if there's enough space above
                    // We need roughly 150-200px. Let's start with check.
                    // rect.top is the distance from viewport top to element top.
                    if (rect.top < 200) {
                        isTop = false; // Flip to bottom
                    }
                } else {
                    // Check if there's enough space below
                    const spaceBelow = window.innerHeight - rect.bottom;
                    if (spaceBelow < 200) {
                        isTop = true; // Flip to top
                    }
                }

                if (isTop) {
                    top = rect.top + window.scrollY - 24;
                } else {
                    top = rect.bottom + window.scrollY + 24;
                }

                // Determine Horizontal Position
                // Default preference: Center aligned
                let preferredLeft = centerX - (TOOLTIP_WIDTH / 2);

                // Adjust preference based on props if needed (e.g. left/right specific)
                if (position === 'bottomLeft' || position === 'topLeft') {
                    // Align right edge of tooltip to right edge of target
                    preferredLeft = rect.right - TOOLTIP_WIDTH;
                } else if (position === 'bottomRight' || position === 'topRight') {
                    // Align left edge of tooltip to lift edge of target
                    preferredLeft = rect.left;
                }

                // Clamp to Viewport
                const maxLeft = window.innerWidth - TOOLTIP_WIDTH - PADDING;
                const clampedLeft = clamp(preferredLeft, PADDING, maxLeft);

                left = clampedLeft + window.scrollX;

                // Calculate Arrow Position (relative to tooltip)
                // Arrow should point to centerX
                // tooltip is at clampedLeft.
                // arrowX = centerX - clampedLeft
                arrowLeft = centerX - clampedLeft;

                // Clamp arrow to be inside tooltip (don't detach)
                arrowLeft = clamp(arrowLeft, 10, TOOLTIP_WIDTH - 10);

                setLayout({ top, left, arrowLeft, isTop });
            }
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

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
                top: layout?.top,
                left: layout?.left,
                // Handle Vertical transform based on calculated state, not prop
                transform: layout?.isTop ? 'translateY(-100%)' : 'none'
            }}
        >
            {/* Connector Line */}
            <div
                className={`absolute bg-stone-900 w-0.5 h-6`}
                style={{
                    left: layout?.arrowLeft,
                    top: layout?.isTop ? '100%' : 'auto',
                    bottom: layout?.isTop ? 'auto' : '100%',
                    transform: 'translateX(-50%)' // Center the arrow horizontally
                }}
            />

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
                        <span className="text-[10px] text-stone-600 font-mono">{stepIndex + 1}/{totalSteps}</span>
                        <button
                            onClick={onNext}
                            className="bg-stone-900 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-stone-900 transition-colors border border-stone-900"
                        >
                            {stepIndex === totalSteps - 1 ? "Finish" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div ref={anchorRef} className="absolute inset-0 pointer-events-none" />
            {layout && createPortal(tooltipContent, document.body)}
        </>
    );
};

export default TourTooltip;
