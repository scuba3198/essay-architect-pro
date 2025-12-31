
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
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">A. Device Signature & Usage Limits</strong>
                            To ensure fair access for all students, we utilize non-intrusive device fingerprinting technologies. This allows us to offer free tiers while preventing abuse of our AI resources.
                        </p>
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">B. Essay Content & AI Processing</strong>
                            The essays and prompts you submit are transiently processed by our Enterprise AI providers (e.g., Google Gemini) solely to generate feedback. We do not use your academic work to train public AI models.
                        </p>
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">C. Payment Verification Data</strong>
                            For premium access, we collect payment proof (screenshots) and your email address. These are stored securely for manual verification. We do not process credit card numbers or banking credentials directly on our servers.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Lock size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">02. Data Usage & Analytics</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-stone-600 list-none">
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>To provide real-time grading and structure analysis via our API partners.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>To verify subscription status and provide access recovery.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span>We use standard analytics tools (e.g., Facebook Pixel) to understand aggregate user behavior and improve our services.</span>
                        </li>
                    </ul>
                </section>

                <section className="space-y-4 text-sm text-stone-600">
                    <div className="flex items-center gap-3">
                        <Server size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">03. Trusted Infrastructure</h3>
                    </div>
                    <p>
                        We rely on industry-standard providers to keep your data safe:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="p-4 border border-stone-200 bg-white">
                            <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-1">Cloud Storage</p>
                            <p className="text-[10px] font-serif">Encrypted databases (Supabase) for account status and payment proofs.</p>
                        </div>
                        <div className="p-4 border border-stone-200 bg-white">
                            <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-1">AI Engine</p>
                            <p className="text-[10px] font-serif">Enterprise-grade Large Language Models for content analysis.</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Share2 size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">04. Data Sharing</h3>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">
                        We are committed to your privacy. We do not sell your personal data. Data is only shared with trusted technical service providers (as listed above) strictly for the purpose of operating the application. Internal notifications regarding payments may be processed via secure messaging platforms.
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
