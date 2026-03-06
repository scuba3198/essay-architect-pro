/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { useState, useCallback } from 'react';
import type { Essay, EssaySectionKey } from '../../domain/types';

export const useEssay = (onStartTimer?: () => void) => {
  const [essay, setEssay] = useState<Essay>({
    intro: { paraphrase: '', thesis: '' },
    body1: { topicSentence: '', explanation: '', example: '', concluding: '' },
    body2: { topicSentence: '', explanation: '', example: '', concluding: '' },
    conclusion: { summary: '', finalThought: '' },
  });

  const handleInputChange = useCallback(
    (section: EssaySectionKey, field: string, value: string) => {
      if (onStartTimer) {
        onStartTimer();
      }
      setEssay((prev) => ({
        ...prev,
        [section]: {
          ...prev[section as EssaySectionKey],
          [field]: value,
        },
      }));
    },
    [onStartTimer],
  );

  const generateFullEssay = useCallback(() => {
    const { intro, body1, body2, conclusion } = essay;
    const text = `${intro.paraphrase} ${intro.thesis}\n\n${body1.topicSentence} ${body1.explanation} ${body1.example} ${body1.concluding}\n\n${body2.topicSentence} ${body2.explanation} ${body2.example} ${body2.concluding}\n\n${conclusion.summary} ${conclusion.finalThought}`;
    return text.replace(/\s+/g, ' ').trim() === '' ? '' : text;
  }, [essay]);

  const calculateWordCount = useCallback((text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }, []);

  const totalWordCount = calculateWordCount(generateFullEssay());

  return {
    essay,
    setEssay,
    handleInputChange,
    generateFullEssay,
    calculateWordCount,
    totalWordCount,
  };
};
