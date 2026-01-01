import React from 'react';
import { X, Scale, FileText, AlertCircle, Ban, CreditCard } from 'lucide-react';

const ToSModal = ({ onClose }) => (
    <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-pointer"
    >
        <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f4f1ea] border-2 border-stone-900 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto relative transform transition-all scale-100 cursor-default custom-scrollbar"
        >
            {/* Header */}
            <div className="bg-stone-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Scale size={120} />
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-yellow-400 transition-colors"
                >
                    <X size={24} strokeWidth={3} />
                </button>

                <div className="relative z-10">
                    <span className="inline-block px-2 py-1 bg-yellow-400 text-stone-900 text-[10px] font-black uppercase tracking-widest mb-2">Legal Agreements</span>
                    <h2 className="text-4xl font-serif font-black tracking-tight leading-none mb-1">Terms of<br />Service</h2>
                    <p className="text-stone-400 text-sm font-mono mt-2 border-t border-stone-700 pt-2 inline-block">Last Updated: 2025</p>
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="font-serif text-lg leading-relaxed text-stone-800 border-l-4 border-yellow-400 pl-4 italic">
                    "By accessing Essay Architect Pro, you agree to these terms. Our goal is to provide a fair, premium academic tool for everyone."
                </div>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">01. Acceptance of Terms</h3>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">
                        By using Essay Architect Pro ("Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service. We reserve the right to modify these terms at any time.
                    </p>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Ban size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">02. Usage Restrictions</h3>
                    </div>
                    <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">A. Fair Use Policy</strong>
                            You are granted a limited, non-exclusive license to use the Service for personal academic practice. You agree not to misuse the AI generation tools to mass-produce content or attempt to reverse-engineer our proprietary scoring algorithms.
                        </p>
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">B. Account Security</strong>
                            You are responsible for safeguarding the password that you use to access the Service. We enforce a single-device login policy to prevent account sharing.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <CreditCard size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">03. Payments & Refunds</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-stone-600 list-none">
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span><strong>All sales are final.</strong> Due to the digital nature of the services (Lifetime Pack, Preparation Pack, Crammer's Pass), we do not offer refunds once access has been granted.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>Access is granted manually after payment verification. While we strive for instant access, please allow up to 2 hours for manual approval during peak times.</span>
                        </li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">04. Disclaimers</h3>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">
                        The AI feedback and band score estimates provided are for practice purposes only. They do not guarantee specific results on actual IELTS or PTE exams. We are not affiliated with the official testing bodies.
                    </p>
                </section>

                <div className="bg-stone-900 p-8 text-white text-center">
                    <p className="text-xs uppercase tracking-[0.2em] font-bold mb-4">Questions regarding these terms?</p>
                    <p className="font-serif text-sm text-stone-400">Contact us at support@essay-architect.uk</p>
                    <button
                        onClick={onClose}
                        className="mt-6 px-12 py-3 bg-yellow-400 text-stone-900 font-black uppercase tracking-widest hover:bg-white transition-colors text-xs"
                    >
                        I Agree
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default ToSModal;
