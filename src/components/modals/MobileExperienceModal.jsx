import React from 'react';
import { X, Smartphone, Monitor } from 'lucide-react';

const MobileExperienceModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-900/90 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-[#f4f1ea] border-4 border-stone-900 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] max-w-sm w-full relative overflow-hidden">

                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-stone-900 z-20">
                    <X size={24} />
                </button>

                <div className="p-8 pt-10 text-center relative z-10">
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-200 border-2 border-stone-900 opacity-50">
                            <Smartphone size={24} className="text-stone-500" />
                        </div>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 border-2 border-stone-900 rotate-3 z-10">
                            <Monitor size={32} strokeWidth={3} className="text-stone-900" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-serif font-black text-stone-900 mb-4 leading-tight uppercase">
                        Desktop <br /> Recommended
                    </h2>

                    <p className="text-stone-700 font-medium text-sm leading-relaxed mb-8">
                        For the best experience with our writing wizard and AI tools, we highly recommend switching to a <span className="font-bold text-stone-900">Laptop or Desktop</span>.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full bg-stone-900 text-white py-3 px-6 font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-[4px_4px_0px_0px_rgba(253,224,71,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    >
                        I Understand
                    </button>

                    <p className="mt-6 text-[9px] font-black text-stone-400 uppercase tracking-widest">
                        You can still proceed on mobile.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MobileExperienceModal;
