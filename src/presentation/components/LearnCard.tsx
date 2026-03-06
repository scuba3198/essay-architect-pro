/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type React from 'react';

interface LearnCardProps {
  title: string;
  desc: string;
  number: string;
}

export const LearnCard: React.FC<LearnCardProps> = ({ title, desc, number }) => (
  <div className="group border-2 border-stone-900 bg-white hover:bg-stone-900 hover:text-white transition-all cursor-default relative overflow-hidden p-6 flex flex-col justify-between min-h-[220px]">
    <div className="absolute top-4 right-4 text-4xl font-black font-serif text-stone-100 group-hover:text-stone-800 transition-colors z-0">
      {number}
    </div>

    <div className="relative z-10">
      <h3 className="font-black text-2xl font-serif mb-4 uppercase tracking-tight">{title}</h3>
      <div className="w-12 h-1 bg-yellow-400 mb-4 group-hover:bg-white transition-colors"></div>
      <p className="text-sm font-medium leading-relaxed opacity-90">{desc}</p>
    </div>
  </div>
);
