
import React from 'react';
import { X, Shield, Eye, Lock, Server, Share2 } from 'lucide-react';

const PrivacyModal = ({ onClose }) => (
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
                    <Shield size={120} />
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-yellow-400 transition-colors"
                >
                    <X size={24} strokeWidth={3} />
                </button>

                <div className="relative z-10">
                    <span className="inline-block px-2 py-1 bg-yellow-400 text-stone-900 text-[10px] font-black uppercase tracking-widest mb-2">Legal & Privacy</span>
                    <h2 className="text-4xl font-serif font-black tracking-tight leading-none mb-1">Privacy<br />Policy</h2>
                    <p className="text-stone-400 text-sm font-mono mt-2 border-t border-stone-700 pt-2 inline-block">Last Updated: 2025</p>
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="font-serif text-lg leading-relaxed text-stone-800 border-l-4 border-yellow-400 pl-4 italic">
                    "Your intellectual property and privacy are the foundation of your academic journey. We protect both with transparency and integrity."
                </div>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Eye size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">01. Information We Collect</h3>
                    </div>
                    <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">A. Usage Data & Device Signature</strong>
                            To maintain the integrity of our free tier and prevent abuse, we generate a unique, non-personal device signature based on your browser's hardware and software configuration. This does not identify you personally.
                        </p>
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">B. Account Information</strong>
                            For Pro Edition users, we collect and store your email address solely for payment verification and to grant access to premium features.
                        </p>
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">C. Content Data</strong>
                            The essays and prompts you input are processed to provide AI-driven feedback and structure enforcement.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Lock size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">02. How We Use Data</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-stone-600 list-none">
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>To provide the core functionalities of the Essay Architect Pro wizard and AI services.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>To verify subscription status and provide technical support.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>To enforce usage limits and ensure fair access for all students.</span>
                        </li>
                    </ul>
                </section>

                <section className="space-y-4 text-sm text-stone-600">
                    <div className="flex items-center gap-3">
                        <Server size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">03. Third-Party Services</h3>
                    </div>
                    <p>
                        We utilize industry-leading infrastructure to power our platform. Your data may be processed by:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="p-4 border border-stone-200 bg-white">
                            <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-1">Secure Data Storage</p>
                            <p className="text-[10px] font-serif">Encrypted cloud databases for payment records and usage counts.</p>
                        </div>
                        <div className="p-4 border border-stone-200 bg-white">
                            <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-1">AI Processing</p>
                            <p className="text-[10px] font-serif">Content analysis via advanced generative language models.</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Share2 size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">04. Data Sharing</h3>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">
                        We do not sell, trade, or otherwise transfer your personal information to outside parties. This does not include trusted third parties who assist us in operating our website and conducting our business, so long as those parties agree to keep this information confidential.
                    </p>
                </section>

                <div className="bg-stone-900 p-8 text-white text-center">
                    <p className="text-xs uppercase tracking-[0.2em] font-bold mb-4">Questions or Data Requests?</p>
                    <p className="font-serif text-sm text-stone-400">Reach out via the official channels or GitHub repository.</p>
                    <button
                        onClick={onClose}
                        className="mt-6 px-12 py-3 bg-yellow-400 text-stone-900 font-black uppercase tracking-widest hover:bg-white transition-colors text-xs"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default PrivacyModal;
