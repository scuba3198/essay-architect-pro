/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type React from 'react';
import {
  Award,
  Clock,
  HelpCircle,
  LogOut,
  Menu,
  RotateCcw,
  User,
  X,
  Zap,
} from 'lucide-react';
import TourTooltip from './TourTooltip';
import type { TourProps, User as UserType } from '../../domain/types';

interface AppHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  timer: number;
  isTimerRunning: boolean;
  formatTime: (seconds: number) => string;
  toggleTimer: () => void;
  resetTimer: () => void;
  user: UserType | null;
  isPaid: boolean;
  activePlan: string | null;
  onLogout: () => void;
  onShowAuth: () => void;
  onShowPricing: () => void;
  onShowAbout: () => void;
  tourProps: TourProps | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  isMenuOpen,
  setIsMenuOpen,
  timer,
  isTimerRunning,
  formatTime,
  toggleTimer,
  resetTimer,
  user,
  isPaid,
  activePlan,
  onLogout,
  onShowAuth,
  onShowPricing,
  onShowAbout,
  tourProps,
}) => {
  return (
    <header className="bg-[#f4f1ea] border-b-2 border-stone-900 px-4 md:px-6 py-4 md:py-5 flex justify-between items-center z-50 sticky top-0">
      <div
        className="flex items-center gap-3 md:gap-6 shrink-1 md:shrink-0 min-w-0 cursor-pointer"
        onClick={() => window.location.reload()}
      >
        <div className="bg-stone-900 text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-serif font-black text-lg md:text-xl shrink-0">
          E
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-2xl font-serif font-black tracking-tighter text-stone-900 flex items-center gap-2 md:gap-3 leading-none truncate">
            ESSAY ARCHITECT PRO
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowAbout();
              }}
              className="text-stone-400 hover:text-stone-900 transition-colors"
            >
              <HelpCircle size={18} />
            </button>
          </h1>
          <p className="hidden md:block text-[10px] font-bold text-stone-500 tracking-widest uppercase mt-1">
            v0.4.0-ts • IELTS & PTE Edition
          </p>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8 shrink-0">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('learn')}
            className={`text-sm font-bold uppercase tracking-wider transition-all duration-300 relative mr-4 ${
              activeTab === 'learn'
                ? 'text-stone-900 after:content-[""] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-stone-900'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            The Guide
          </button>

          <div className="w-4 h-8 relative flex flex-col items-center justify-end">
            {tourProps && (
              <TourTooltip
                stepIndex={0}
                text="Switch between The Guide (Theory) and The Wizard (Practice)."
                position="bottom"
                {...tourProps}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`text-sm font-bold uppercase tracking-wider transition-all duration-300 relative ml-4 ${
              activeTab === 'practice'
                ? 'text-stone-900 after:content-[""] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-stone-900'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            The Wizard
          </button>
        </div>

        <div className="flex items-center gap-3 border-l-2 border-stone-300 pl-6 relative">
          <div className="flex items-center gap-2 text-stone-900">
            <Clock
              size={16}
              strokeWidth={3}
              className={isTimerRunning ? 'text-red-500 animate-pulse' : 'text-stone-400'}
            />
            <span className="font-mono font-bold w-[3rem] text-center text-sm">
              {formatTime(timer)}
            </span>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={toggleTimer}
              className={`w-6 h-6 flex items-center justify-center border border-stone-900 hover:bg-stone-900 hover:text-white transition-colors`}
              title={isTimerRunning ? 'Pause' : 'Start'}
            >
              {isTimerRunning ? (
                <div className="flex gap-[2px]">
                  <div className="w-0.5 h-2 bg-current" />
                  <div className="w-0.5 h-2 bg-current" />
                </div>
              ) : (
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-current border-b-[4px] border-b-transparent ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className="w-6 h-6 flex items-center justify-center border border-stone-900 text-stone-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
              title="Reset"
            >
              <RotateCcw size={10} />
            </button>
          </div>

          {tourProps && (
            <TourTooltip
              stepIndex={2}
              text="Time is of the essence. Track it here."
              position="bottomLeft"
              {...tourProps}
            />
          )}
        </div>

        <div className="relative flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-[10px] font-black uppercase text-stone-900 tracking-widest truncate max-w-[120px]">
                  {user.user_metadata?.['full_name'] || user.email}
                </span>
                {isPaid && (
                  <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                    <Zap size={8} fill="currentColor" /> {activePlan}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 border-2 border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-stone-900"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onShowAuth}
              className="flex items-center gap-2 px-4 py-2 border-2 border-stone-900 font-black uppercase text-[10px] tracking-widest bg-white text-stone-900 hover:bg-stone-900 hover:text-white transition-all"
            >
              <User size={14} /> Login / Sign Up
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={onShowPricing}
              className={`flex items-center gap-2 px-4 py-2 border-2 border-stone-900 font-black uppercase text-[10px] tracking-widest transition-all ${
                isPaid
                  ? 'bg-green-500 text-white border-green-600'
                  : 'bg-yellow-400 text-stone-900 hover:bg-stone-900 hover:text-white'
              }`}
            >
              {isPaid ? <Award size={14} /> : <Zap size={14} />}
              {isPaid ? 'Pro Access' : 'Upgrade'}
            </button>
            {tourProps && (
              <TourTooltip
                stepIndex={5}
                text="Unlock unlimited AI grading and premium features here."
                position="bottomRight"
                {...tourProps}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        type="button"
        className="md:hidden text-stone-900 p-2 shrink-0"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#f4f1ea] border-b-2 border-stone-900 z-40 flex flex-col p-6 gap-6 shadow-xl animate-in slide-in-from-top-5 max-h-[calc(100dvh-5rem)] overflow-y-auto pb-24">
          <div className="flex flex-col gap-4 border-b border-stone-300 pb-6">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-lg">Navigation</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('learn');
                  setIsMenuOpen(false);
                }}
                className={`text-left p-3 border-2 ${
                  activeTab === 'learn'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 text-stone-500'
                } font-bold uppercase tracking-wider transition-all`}
              >
                The Guide (Theory)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('practice');
                  setIsMenuOpen(false);
                }}
                className={`text-left p-3 border-2 ${
                  activeTab === 'practice'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 text-stone-500'
                } font-bold uppercase tracking-wider transition-all`}
              >
                The Wizard (Practice)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-b border-stone-300 pb-6">
            <span className="font-serif font-bold text-lg">Timer</span>
            <div className="flex items-center justify-between bg-white p-4 border border-stone-200">
              <div className="flex items-center gap-2 text-stone-900">
                <Clock
                  size={20}
                  strokeWidth={3}
                  className={isTimerRunning ? 'text-red-500 animate-pulse' : 'text-stone-400'}
                />
                <span className="font-mono font-bold text-xl">{formatTime(timer)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleTimer}
                  className={`w-10 h-10 flex items-center justify-center border-2 border-stone-900 hover:bg-stone-900 hover:text-white transition-colors`}
                >
                  {isTimerRunning ? (
                    <div className="flex gap-[3px]">
                      <div className="w-1 h-3 bg-current" />
                      <div className="w-1 h-3 bg-current" />
                    </div>
                  ) : (
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-current border-b-[6px] border-b-transparent ml-1" />
                  )}
                </button>
                <button
                  onClick={resetTimer}
                  className="w-10 h-10 flex items-center justify-center border-2 border-stone-900 text-stone-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {user ? (
              <>
                <div className="flex items-center justify-between p-4 bg-stone-100 border border-stone-200">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-stone-900 tracking-widest">
                      {user.user_metadata?.['full_name'] || user.email}
                    </span>
                    {isPaid && (
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Zap size={10} fill="currentColor" /> {activePlan}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-stone-900 font-bold uppercase tracking-widest text-xs"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onShowAuth();
                  setIsMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 p-3 border-2 border-stone-900 font-black uppercase text-xs tracking-widest bg-white text-stone-900 hover:bg-stone-900 hover:text-white transition-all"
              >
                <User size={16} /> Login / Sign Up
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onShowPricing();
                setIsMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 p-3 border-2 border-stone-900 font-black uppercase text-xs tracking-widest transition-all ${
                isPaid
                  ? 'bg-green-500 text-white border-green-600'
                  : 'bg-yellow-400 text-stone-900 hover:bg-stone-900 hover:text-white'
              }`}
            >
              {isPaid ? <Award size={16} /> : <Zap size={16} />}
              {isPaid ? 'Pro Access Active' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
