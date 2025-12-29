
import React from 'react';
import { X, Zap, Rocket, Award } from 'lucide-react';

const LimitExhaustedModal = ({ isOpen, onClose, onUpgrade, type = 'exhausted' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/90 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#f4f1ea] border-4 border-stone-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-w-md w-full relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-yellow-400 rounded-full opacity-20 blur-3xl"></div>

                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-stone-900 z-20">
                    <X size={24} />
                </button>

                <div className="p-8 pt-10 text-center relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 border-2 border-stone-900 mb-6 rotate-3">
                        <Zap size={32} strokeWidth={3} className="text-stone-900 animate-pulse" />
                    </div>

                    <h2 className="text-4xl font-serif font-black text-stone-900 mb-4 leading-none tracking-tighter uppercase italic">
                        {type === 'halfway' ? "You're halfway there!" : "Limit Reached"}
                    </h2>

                    <p className="text-stone-700 font-medium text-lg leading-relaxed mb-8">
                        {type === 'halfway'
                            ? <>Don't lose your flow. Get 24-hour unlimited access for the price of only <span className="text-stone-900 font-black border-b-4 border-yellow-400">Rs. 50</span>.</>
                            : "You've used all your free generations. Upgrade now to continue mastering your essays."}
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => onUpgrade('Crammer\'s Pass')}
                            className="w-full bg-stone-900 text-white py-4 px-6 font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center gap-3 group shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                        >
                            <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            Get 24h Access Now
                        </button>

                        <button
                            onClick={() => onUpgrade(null)}
                            className="w-full bg-transparent border-2 border-stone-900 text-stone-900 py-3 font-bold uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Award size={16} />
                            View All Plans
                        </button>
                    </div>

                    <p className="mt-8 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] italic">
                        The Architect favors the bold.
                    </p>
                </div>

                {/* Bottom accent bar */}
                <div className="h-2 bg-yellow-400 border-t-2 border-stone-900"></div>
            </div>
        </div>
    );
};

export default LimitExhaustedModal;
