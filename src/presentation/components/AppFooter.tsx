/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type React from 'react';
import { Facebook, Github } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface AppFooterProps {
  activeTab: string;
  onShowPrivacy: () => void;
  onShowToS: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  activeTab,
  onShowPrivacy,
  onShowToS,
}) => {
  return (
    <footer
      className={`bg-[#f4f1ea] border-t-2 border-stone-900 py-3 px-6 flex flex-col md:flex-row justify-between items-center shrink-0 z-50 gap-2 fixed bottom-0 w-full md:static ${
        activeTab === 'practice' ? 'hidden md:flex' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Architected by{' '}
          <a
            href="https://scuba3198.github.io/mumukshu-portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-900 font-black border-b-2 border-yellow-400 hover:bg-yellow-400 transition-colors cursor-pointer"
          >
            Mumukshu D.C.
          </a>
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/9779862329617"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-green-500 transition-colors"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon size={16} />
          </a>
          <a
            href="https://github.com/scuba3198"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-stone-900 transition-colors"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61585812331891"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-blue-600 transition-colors"
            aria-label="Facebook"
          >
            <Facebook size={16} />
          </a>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onShowPrivacy}
          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
        >
          Privacy Policy
        </button>
        <button
          onClick={onShowToS}
          className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
        >
          Terms of Service
        </button>
      </div>
    </footer>
  );
};
