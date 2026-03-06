/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { PenTool, RefreshCw } from 'lucide-react';
import { AIClient } from '../../infrastructure/api/api';
import type { Essay, EssaySectionKey, Topic, TourProps } from '../../domain/types';
import StepWizard from './StepWizard';
import PreviewSection from './PreviewSection';
import TourTooltip from './TourTooltip';
import { topics } from '../../domain/data/topics';

interface PracticeTabProps {
  essay: Essay;
  handleInputChange: (section: EssaySectionKey, field: string, value: string) => void;
  totalWordCount: number;
  tourProps: TourProps | null;
  topic: Topic | null;
  setTopic: (topic: Topic | null) => void;
  isPaid: boolean;
  aiUsageCount: number;
  examinerUsageCount: number;
  incrementFreeUsage: () => void;
  onLimitReached: () => void;
  onExaminerOpen: () => void;
  copyToClipboard: () => void;
  aiClient: AIClient;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export const PracticeTab: React.FC<PracticeTabProps> = ({
  essay,
  handleInputChange,
  totalWordCount,
  tourProps,
  topic,
  setTopic,
  isPaid,
  aiUsageCount,
  examinerUsageCount,
  incrementFreeUsage,
  onLimitReached,
  onExaminerOpen,
  copyToClipboard,
  aiClient,
  currentStep,
  setCurrentStep,
}) => {
  const [mobilePracticeTab, setMobilePracticeTab] = useState<'wizard' | 'preview'>('wizard');
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const getNewRandomTopic = useCallback(() => {
    const otherTopics = topics.filter((t) => t.id !== topic?.id);
    if (otherTopics.length === 0) return;
    setTopic(otherTopics[Math.floor(Math.random() * otherTopics.length)] ?? null);
  }, [topic, setTopic]);

  const handleTopicChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newQuestion = e.target.value;
      setTopic(
        topic
          ? { ...topic, question: newQuestion }
          : ({ question: newQuestion, id: 0, type: 'default' } as Topic),
      );
    },
    [topic, setTopic],
  );

  // Auto-resize prompt textarea
  const adjustHeight = useCallback(() => {
    if (promptRef.current) {
      promptRef.current.style.height = 'auto';
      promptRef.current.style.height = `${promptRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
    const timer = setTimeout(adjustHeight, 10);
    return () => clearTimeout(timer);
  }, [topic, adjustHeight]);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Mobile Tab Switcher - only visible on mobile */}
      <div className="md:hidden flex border-b-2 border-stone-900 bg-white sticky top-0 z-30">
        <button
          type="button"
          onClick={() => setMobilePracticeTab('wizard')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
            mobilePracticeTab === 'wizard'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-400 hover:text-stone-900'
          }`}
        >
          ✏️ Write
        </button>
        <button
          onClick={() => setMobilePracticeTab('preview')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all border-l-2 border-stone-900 ${
            mobilePracticeTab === 'preview'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-400 hover:text-stone-900'
          }`}
        >
          👁️ Preview ({totalWordCount}w)
        </button>
      </div>

      {/* Wizard Section - hidden on mobile if preview tab is active */}
      <div
        className={`w-full md:w-3/5 p-0 overflow-y-auto custom-scrollbar bg-[#f4f1ea] md:border-r-2 border-stone-900 ${
          mobilePracticeTab !== 'wizard' ? 'hidden md:block' : ''
        }`}
      >
        <div className="p-8 pb-4">
          <div className="border-2 border-stone-900 bg-white p-6 relative shadow-[8px_8px_0px_0px_rgba(28,25,23,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] transition-shadow duration-300">
            <div className="flex justify-between items-start mb-4 border-b border-stone-200 pb-4">
              <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Topic: {topic?.type}
              </span>
              <div className="relative z-20">
                <button
                  type="button"
                  onClick={getNewRandomTopic}
                  className="text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                  title="Get new random topic"
                >
                  <RefreshCw size={12} /> New Prompt
                </button>
                {tourProps && (
                  <TourTooltip
                    stepIndex={1}
                    text="This is your prompt. Auto-resizes as you type. Click 'New Prompt' to shuffle."
                    position="bottomLeft"
                    {...tourProps}
                  />
                )}
              </div>
            </div>
            <div className="relative group">
              <textarea
                ref={promptRef}
                className={`w-full text-stone-900 font-serif font-bold leading-tight bg-transparent border-0 p-0 resize-none outline-none placeholder:text-stone-300 overflow-hidden ${
                  (topic?.question?.length || 0) > 150
                    ? 'text-xs'
                    : (topic?.question?.length || 0) > 80
                      ? 'text-sm'
                      : 'text-lg'
                }`}
                value={topic?.question || ''}
                onChange={handleTopicChange}
                rows={1}
                placeholder="Type your essay question here..."
              />
              <div className="absolute right-0 bottom-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <PenTool size={14} className="text-stone-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="pb-28 md:pb-0 min-h-[500px] p-8 pt-0">
          <StepWizard
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            essay={essay}
            handleInputChange={handleInputChange}
            tourProps={tourProps}
            topic={topic}
            isPaid={isPaid}
            freeUsageCount={aiUsageCount}
            onIncrementUsage={incrementFreeUsage}
            onLimitReached={onLimitReached}
            aiClient={aiClient}
          />
        </div>
      </div>

      {/* Preview Section - hidden on mobile if wizard tab is active, full height on mobile when visible */}
      <div
        className={`w-full md:w-2/5 md:h-auto border-t-2 md:border-t-0 border-stone-900 relative z-10 bg-white ${
          mobilePracticeTab !== 'preview' ? 'hidden md:block' : 'flex-1'
        }`}
      >
        <PreviewSection
          essay={essay}
          totalWordCount={totalWordCount}
          setShowExaminer={onExaminerOpen}
          copyToClipboard={copyToClipboard}
          tourProps={tourProps}
          isPaid={isPaid}
          examinerUsageCount={examinerUsageCount}
        />
      </div>
    </div>
  );
};
