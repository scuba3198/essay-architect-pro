/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { useState, useEffect } from 'react';
import type { TourProps } from '../../domain/types';

export const useTour = (activeTab: string) => {
  const [tourStep, setTourStep] = useState<number>(() => {
    const tourCompleted = localStorage.getItem('essay-architect-tour-completed');
    return tourCompleted === 'true' ? -1 : -1; // Start at -1, will be set to 0 on first theory tab visit
  });
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() => {
    const tourCompleted = localStorage.getItem('essay-architect-tour-completed');
    return tourCompleted === 'true';
  });

  useEffect(() => {
    if (activeTab === 'practice' && !hasSeenTour) {
      setTourStep(0);
      setHasSeenTour(true);
    }
  }, [activeTab, hasSeenTour]);

  const nextTourStep = () => {
    if (tourStep < 5) {
      setTourStep(tourStep + 1);
    } else {
      setTourStep(-1);
      setHasSeenTour(true);
      localStorage.setItem('essay-architect-tour-completed', 'true');
    }
  };

  const skipTour = () => {
    setTourStep(-1);
    setHasSeenTour(true);
    localStorage.setItem('essay-architect-tour-completed', 'true');
  };

  const tourProps: TourProps = {
    currentStep: tourStep,
    onNext: nextTourStep,
    onSkip: skipTour,
    totalSteps: 6,
  };

  return {
    tourStep,
    hasSeenTour,
    tourProps,
    nextTourStep,
    skipTour,
  };
};
