/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { useState, useCallback } from 'react';
import type { Plan } from '../../domain/types';

export type AuthMode = 'login' | 'signup' | 'forgot_password' | 'update_password';

export const useModals = () => {
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showExaminer, setShowExaminer] = useState<boolean>(false);
  const [showToS, setShowToS] = useState<boolean>(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [showPricing, setShowPricing] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const openModal = useCallback((name: string) => {
    switch (name) {
      case 'about':
        setShowAbout(true);
        break;
      case 'privacy':
        setShowPrivacy(true);
        break;
      case 'auth':
        setShowAuth(true);
        break;
      case 'examiner':
        setShowExaminer(true);
        break;
      case 'tos':
        setShowToS(true);
        break;
      case 'payment':
        setShowPayment(true);
        break;
      case 'pricing':
        setShowPricing(true);
        break;
      case 'limit':
        setShowLimitModal(true);
        break;
      case 'feedback':
        setShowFeedback(true);
        break;
    }
  }, []);

  const closeModal = useCallback((name: string) => {
    switch (name) {
      case 'about':
        setShowAbout(false);
        break;
      case 'privacy':
        setShowPrivacy(false);
        break;
      case 'auth':
        setShowAuth(false);
        setAuthMode('login');
        break;
      case 'examiner':
        setShowExaminer(false);
        break;
      case 'tos':
        setShowToS(false);
        break;
      case 'payment':
        setShowPayment(false);
        break;
      case 'pricing':
        setShowPricing(false);
        break;
      case 'limit':
        setShowLimitModal(false);
        break;
      case 'feedback':
        setShowFeedback(false);
        break;
    }
  }, []);

  return {
    showAbout,
    showPrivacy,
    showAuth,
    authMode,
    showExaminer,
    showToS,
    showPayment,
    showPricing,
    selectedPlan,
    showLimitModal,
    showFeedback,
    setShowAbout,
    setShowPrivacy,
    setShowAuth,
    setAuthMode,
    setShowExaminer,
    setShowToS,
    setShowPayment,
    setShowPricing,
    setSelectedPlan,
    setShowLimitModal,
    setShowFeedback,
    openModal,
    closeModal,
  };
};
