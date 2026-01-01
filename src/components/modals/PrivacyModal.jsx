import React from 'react';
import { X, Shield, Eye, Lock, Server, Share2, Clock, UserCheck } from 'lucide-react';

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
                    <span className="inline-block px-2 py-1 bg-yellow-400 text-stone-900 text-[10px] font-black uppercase tracking-widest mb-2">Your Data Matters</span>
                    <h2 className="text-4xl font-serif font-black tracking-tight leading-none mb-1">Privacy<br />Policy</h2>
                    <p className="text-stone-400 text-sm font-mono mt-2 border-t border-stone-700 pt-2 inline-block">Last Updated: 2025</p>
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="font-serif text-lg leading-relaxed text-stone-800 border-l-4 border-yellow-400 pl-4 italic">
                    "Your essays are your intellectual property. We handle your data with the same care and respect you put into your writing."
                </div>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Eye size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">01. What We Collect</h3>
                    </div>
                    <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">A. Account Information</strong>
                            When you create an account, we collect your email address for authentication, subscription management, and essential communications about your account.
                        </p>
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">B. Essay Content</strong>
                            The essays you submit are processed in real-time by our AI partners to generate feedback. Your work is <strong>never</strong> stored permanently or used to train AI models.
                        </p>
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">C. Device & Session Data</strong>
                            We use lightweight device fingerprinting to enforce fair usage limits on free tiers and maintain secure session management for your account.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Lock size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">02. How We Use Your Data</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-stone-600 list-none">
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span><strong>AI Feedback:</strong> To analyze your essays and provide real-time scoring, structure analysis, and improvement suggestions.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span><strong>Account Management:</strong> To verify your subscription status, manage sessions, and enable access recovery.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span><strong>Service Improvement:</strong> Anonymized, aggregate analytics help us understand usage patterns and improve the platform.</span>
                        </li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Server size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">03. Where We Store Data</h3>
                    </div>
                    <p className="text-sm text-stone-600 mb-3">
                        Your data is protected by industry-leading infrastructure:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-stone-200 bg-white">
                            <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-1">Supabase</p>
                            <p className="text-[10px] font-serif">Encrypted PostgreSQL databases with Row Level Security for account data.</p>
                        </div>
                        <div className="p-4 border border-stone-200 bg-white">
                            <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-1">Enterprise AI</p>
                            <p className="text-[10px] font-serif">Zero-retention API partners — your essays aren't stored after processing.</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Share2 size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">04. Who Sees Your Data</h3>
                    </div>
                    <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">A. We Never Sell Your Data</strong>
                            Your personal information and essay content are never sold to third parties. Period.
                        </p>
                        <p>
                            <strong className="text-stone-900 uppercase text-[10px] tracking-wider block mb-1">B. Limited Third-Party Sharing</strong>
                            Data is shared only with our technical service providers (authentication, AI processing) strictly to operate the service. Payment notifications may be processed via secure channels.
                        </p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Clock size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">05. Data Retention</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-stone-600 list-none">
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span><strong>Essay Content:</strong> Processed in real-time and immediately discarded — we don't keep copies.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span><strong>Account Data:</strong> Retained while your account is active. You can request deletion at any time.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-yellow-500 font-bold">•</span>
                            <span><strong>Payment Records:</strong> Kept for legal compliance and dispute resolution purposes.</span>
                        </li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <UserCheck size={20} className="text-stone-900" />
                        <h3 className="font-serif font-black text-xl uppercase tracking-tight">06. Your Rights</h3>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">
                        You have the right to access, correct, or delete your personal data at any time. To exercise these rights or for any privacy-related concerns, reach out through our official channels. We respond to all data requests within 30 days.
                    </p>
                </section>

                <div className="bg-stone-900 p-8 text-white text-center">
                    <p className="text-xs uppercase tracking-[0.2em] font-bold mb-4">Questions about your data?</p>
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
