/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type React from 'react';
import { Award } from 'lucide-react';
import { LearnCard } from './LearnCard';
import TestimonialSection from './TestimonialSection';

interface LearnTabProps {
  onGoToPractice: () => void;
}

export const LearnTab: React.FC<LearnTabProps> = ({ onGoToPractice }) => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#f4f1ea] pb-28 md:pb-0">
      <div className="max-w-7xl mx-auto p-12">
        <div className="mb-16 border-b-4 border-stone-900 pb-12">
          <h2 className="text-5xl sm:text-7xl md:text-8xl font-black font-serif text-stone-900 mb-6 tracking-tighter leading-[0.8]">
            MASTER <br />
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-stone-800 to-stone-600"
              style={{ WebkitTextStroke: '2px #1c1917' }}
            >
              THE
            </span>{' '}
            <br />
            ARCHITECT PRO
          </h2>
          <p className="text-stone-900 text-xl font-serif max-w-2xl border-l-4 border-yellow-400 pl-6 italic">
            Essay Architect Pro isn't just a wizard—it's a comprehensive training ground. Here is
            how to get the most out of it.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <LearnCard
            title="The Wizard"
            desc="Breaks your essay into manageable chunks (Intro, Body, Conclusion) to enforce perfect structure."
            number="01"
          />
          <LearnCard
            title="AI Refiner"
            desc="Stuck? Experience hyper-smart autocompletion and sentence polishing powered by our custom Next-Gen Pro AI engine."
            number="02"
          />
          <LearnCard
            title="The Examiner"
            desc="Receive instant, strict grading and feedback based on official IELTS/PTE criteria."
            number="03"
          />
          <LearnCard
            title="Premium Access"
            desc="No API keys or complex setups. Get instant, centralized AI grading optimized for the Nepali academic market."
            number="04"
          />
        </div>

        <div className="mb-16 grid md:grid-cols-2 gap-12 text-stone-900">
          <div>
            <h3 className="font-serif font-bold text-2xl mb-4">
              The Ultimate IELTS & PTE Writing Tool
            </h3>
            <p className="font-medium leading-relaxed opacity-80 mb-6">
              Achieving a high band score in IELTS or PTE requires more than just vocabulary—it
              requires structure. Essay Architect PRO is the specialized tool that forces you to
              plan your essay paragraph by paragraph before you write.
            </p>
            <p className="font-medium leading-relaxed opacity-80">
              Stop practicing blindly. With our{' '}
              <strong className="font-bold text-stone-900">advanced AI examiner</strong>, you receive
              instant feedback on your coherence, cohesion, and lexical resource, tailored
              specifically to the marking criteria of international English exams.
            </p>
          </div>
          <div>
            <h3 className="font-serif font-bold text-2xl mb-4">Why Structure Matters</h3>
            <ul className="space-y-3 font-medium opacity-80">
              <li className="flex gap-3 items-start">
                <span className="text-stone-900 font-bold">•</span>
                <span>Eliminate writer's block with our step-by-step wizard.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-stone-900 font-bold">•</span>
                <span>Ensure every paragraph has a clear topic sentence and example.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-stone-900 font-bold">•</span>
                <span>
                  Master opinion, discussion, and advantage/disadvantage essay types.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-stone-900 font-bold">•</span>
                <span>Get band score estimates instantly.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <TestimonialSection />

      <div className="bg-stone-900 text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Award size={200} />
        </div>
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="font-serif font-black text-4xl mb-4">
              Ready to draft your first piece?
            </h3>
            <p className="text-stone-400 mb-8 max-w-md">
              Put the theory into practice with our live wizard. Real-time preview, word counting,
              and structure enforcement included.
            </p>
            <button
              onClick={onGoToPractice}
              className="bg-yellow-400 text-stone-900 px-8 py-4 font-black uppercase tracking-widest hover:bg-white transition-colors"
            >
              Start Writing
            </button>
          </div>
          <div className="space-y-4">
            <div className="border border-stone-700 p-4">
              <span className="text-yellow-400 font-bold uppercase text-xs tracking-wider mb-1 block">
                Opinion Essays
              </span>
              <p className="font-serif text-xl">"To what extent do you agree?"</p>
            </div>
            <div className="border border-stone-700 p-4">
              <span className="text-yellow-400 font-bold uppercase text-xs tracking-wider mb-1 block">
                Discussion Essays
              </span>
              <p className="font-serif text-xl">"Discuss both views and give your opinion."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
