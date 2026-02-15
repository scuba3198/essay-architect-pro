
import React from 'react';
import { X, BookOpen, Wand2, PenTool, Sparkles, RefreshCw, GraduationCap, Clock } from 'lucide-react';

interface AboutModalProps {
    onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => (

    <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-pointer"
    >
        <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#f4f1ea] border-2 border-stone-900 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative transform transition-all scale-100 cursor-default"
        >

            {/* Header */}
            <div className="bg-stone-900 p-6 text-white relative overflow-hidden shrink-0 flex justify-between items-center">
                <div>
                    <span className="inline-block px-2 py-1 bg-yellow-400 text-stone-900 text-[10px] font-black uppercase tracking-widest mb-2">User Manual</span>
                    <h2 className="text-3xl font-serif font-black tracking-tight leading-none">How to Use<br />Essay Architect</h2>
                </div>

                <button
                    onClick={onClose}
                    className="text-white hover:text-yellow-400 transition-colors z-20"
                >
                    <X size={24} strokeWidth={3} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">

                {/* Introduction */}
                <section>
                    <p className="font-serif text-lg leading-relaxed text-stone-800 italic border-l-4 border-yellow-400 pl-4 mb-4">
                        "Essay Architect is designed to simulate the high-pressure environment of IELTS and PTE exams while providing the detailed feedback of a professional tutor."
                    </p>
                </section>

                {/* The Two Modes */}
                <section>
                    <h3 className="flex items-center gap-2 font-black text-xl uppercase tracking-tight mb-4 border-b-2 border-stone-200 pb-2">
                        <BookOpen size={20} /> The Two Modes
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 border border-stone-200">
                            <h4 className="font-bold mb-2">1. The Guide (Theory)</h4>
                            <p className="text-sm text-stone-600">Consider this your textbook. It contains curated lessons on essay structure, vocabulary, and what examiners explicitly look for. Read this to understand the 'rules' before you break them.</p>
                        </div>
                        <div className="bg-white p-4 border border-stone-200">
                            <h4 className="font-bold mb-2">2. The Wizard (Practice)</h4>
                            <p className="text-sm text-stone-600">This is your workshop. It breaks the essay writing process into manageable chunks (Intro, Body Paragraphs, Conclusion) so you never face a blank page.</p>
                        </div>
                    </div>
                </section>

                {/* Using The Wizard */}
                <section>
                    <h3 className="flex items-center gap-2 font-black text-xl uppercase tracking-tight mb-4 border-b-2 border-stone-200 pb-2">
                        <Wand2 size={20} /> Using The Wizard
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="bg-stone-100 p-2 h-fit rounded"><PenTool size={16} /></div>
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wide">Step-by-Step Writing</h4>
                                <p className="text-sm text-stone-600 mt-1">Don't try to write the whole essay at once. The Wizard guides you to write one specific part at a time (e.g., "Write a clear Thesis Statement"). Focusing on small tasks builds a better whole.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="bg-stone-100 p-2 h-fit rounded"><Sparkles size={16} /></div>
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wide">AI Autocomplete</h4>
                                <p className="text-sm text-stone-600 mt-1">Writer's block? Press the <strong>"Complete"</strong> button, and our AI will read what you've written so far and suggest a logical continuation. It's like having a co-writer.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="bg-stone-100 p-2 h-fit rounded"><RefreshCw size={16} /></div>
                            <div>
                                <h4 className="font-bold text-sm uppercase tracking-wide">AI Refiner</h4>
                                <p className="text-sm text-stone-600 mt-1">Wrote a sentence but it feels simple? Use the <strong>"Refine"</strong> button to instantly upgrade your vocabulary and grammar to an academic standard.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The Examiner */}
                <section>
                    <h3 className="flex items-center gap-2 font-black text-xl uppercase tracking-tight mb-4 border-b-2 border-stone-200 pb-2">
                        <GraduationCap size={20} /> The Examiner
                    </h3>
                    <p className="text-sm text-stone-600 mb-4">
                        Once you've finished your essay, click the <strong>"Grade Essay"</strong> button.
                    </p>
                    <div className="bg-stone-900 text-stone-300 p-4 text-sm rounded-sm">
                        <ul className="list-disc pl-4 space-y-2">
                            <li><strong className="text-white">Strict Scoring:</strong> You get a Band 0-9 (IELTS) or 10-90 (PTE) score.</li>
                            <li><strong className="text-white">Detailed Feedback:</strong> The AI explains exactly <em>why</em> you got that score.</li>
                            <li><strong className="text-white">Actionable Fixes:</strong> It highlights specific sentences that need work.</li>
                        </ul>
                    </div>
                </section>

                <div className="bg-yellow-400/20 border border-yellow-400 p-4 text-sm text-stone-800">
                    <strong>Pro Tip:</strong> Use the Timer <Clock className="inline w-3 h-3" /> in the header to simulate real exam conditions (40 mins for IELTS Task 2).
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest hover:bg-yellow-500 hover:text-stone-900 transition-colors border-2 border-transparent hover:border-stone-900"
                >
                    I'm Ready to Begin
                </button>
            </div>
        </div>
    </div>
);

export default AboutModal;
