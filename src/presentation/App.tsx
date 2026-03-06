/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Effect } from 'effect';
import { appRuntime } from '../infrastructure/runtime';
import { supabase } from '../infrastructure/db/supabase';
import type { Plan, Topic } from '../domain/types';
import { topics } from '../domain/data/topics';

// Composition root
import {
  deviceService,
  aiClient,
  registerSessionUseCase,
  validateSessionUseCase,
  deactivateSessionUseCase,
} from './composition';

// Hooks
import { useNotification } from './hooks/useNotification';
import { useModals } from './hooks/useModals';
import { useTimer } from './hooks/useTimer';
import { useTour } from './hooks/useTour';
import { useEssay } from './hooks/useEssay';
import { useUsage } from './hooks/useUsage';
import { useAuth } from './hooks/useAuth';

// Components
import { NotificationToast } from './components/NotificationToast';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { ModalsGate } from './components/ModalsGate';
import { LearnTab } from './components/LearnTab';
import { PracticeTab } from './components/PracticeTab';
import FeedbackButton from './components/FeedbackButton';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('learn');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [topic, setTopic] = useState<Topic | null>(null);

  // Initialize topic
  useEffect(() => {
    setTopic(topics[0] ?? null);
  }, []);

  // Hooks
  const notification = useNotification();
  const modals = useModals();
  const timer = useTimer();
  const tour = useTour(activeTab);
  const essay = useEssay(() => {
    if (!timer.isTimerRunning) {
      timer.toggle();
    }
  });
  const auth = useAuth({
    registerSessionUseCase,
    validateSessionUseCase,
    deactivateSessionUseCase,
    showNotification: notification.show,
  });
  const usage = useUsage({ deviceService, isPaid: auth.isPaid });

  // Deferred Third-Party Analytics Initialization
  useEffect(() => {
    const initAnalytics = () => {
      // 1. Google Tag Manager
      const gtagScript = document.createElement('script');
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-63RTLLNS0T';
      gtagScript.async = true;
      document.head.appendChild(gtagScript);

      // 1. Google Analytics (gtag.js)
      const dataLayer = window.dataLayer || [];
      window.dataLayer = dataLayer;
      function gtag(...args: unknown[]) {
        dataLayer.push(args);
      }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', 'G-63RTLLNS0T');
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(initAnalytics, { timeout: 2000 });
    } else {
      setTimeout(initAnalytics, 2000);
    }
  }, []);

  // Handle password recovery from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationType = urlParams.get('verification_type');
    if (verificationType === 'recovery') {
      modals.setAuthMode('update_password');
      modals.setShowAuth(true);
    }
  }, [modals]);

  // Handle auth state change for password recovery
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        modals.setAuthMode('update_password');
        modals.setShowAuth(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [modals]);

  const handleExaminerOpen = useCallback(() => {
    if (!auth.isPaid && usage.examinerUsageCount >= 1) {
      modals.setShowLimitModal(true);
      return;
    }
    modals.setShowExaminer(true);
  }, [auth.isPaid, usage.examinerUsageCount, modals]);

  const handleUpgradeFromLimit = useCallback(
    (planName: string | null) => {
      modals.setShowLimitModal(false);

      if (planName) {
        // "Get 24h Access Now" - requires login immediately to proceed to payment
        if (!auth.user) {
          modals.setShowAuth(true);
          return;
        }
        const plan: Plan = {
          name: "Crammer's Pass",
          price: 'Rs. 50',
          duration: '24 Hours',
        };
        modals.setSelectedPlan(plan);
        modals.setShowPayment(true);
      } else {
        // "View All Plans" - show pricing modal, login not required yet
        modals.setShowPricing(true);
      }
    },
    [auth.user, modals],
  );

  const copyToClipboard = useCallback(
    () =>
      appRuntime.runPromise(
        Effect.gen(function* () {
          const text = essay.generateFullEssay();
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();

          yield* Effect.try({
            try: () => document.execCommand('copy'),
            catch: (err) => new Error(`Unable to copy: ${err}`),
          });

          const btn = document.getElementById('copyBtn') as HTMLButtonElement | null;
          if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="uppercase font-black">Copied!</span>';
            yield* Effect.forkDaemon(
              Effect.gen(function* () {
                yield* Effect.sleep('2 seconds');
                btn.innerHTML = originalText;
              }),
            );
          }

          document.body.removeChild(textArea);
        }).pipe(
          Effect.catchAll((err) =>
            Effect.logError('Copy to clipboard failed', { error: err }),
          ),
        ),
      ),
    [essay],
  );

  return (
    <div className="h-[100dvh] bg-[#f4f1ea] text-stone-900 font-sans flex flex-col overflow-hidden selection:bg-yellow-300 selection:text-stone-900">
      <NotificationToast
        notification={notification.notification}
        onDismiss={notification.dismiss}
      />
      <Helmet>
        <title>
          {activeTab === 'learn'
            ? 'Essay Architect PRO • Master Academic Writing'
            : 'Essay Architect PRO • AI Writing Wizard'}
        </title>
        <meta
          name="description"
          content="The ultimate AI-powered essay writing and grading tool for IELTS and PTE. Practice with instant feedback, strict scoring, and structural guidance."
        />
        <link rel="canonical" href="https://pro.essay-architect.uk/" />
        <meta property="og:title" content="Essay Architect PRO - AI Essay Writing & Grading" />
        <meta
          property="og:description"
          content="Master your essay writing with real-time AI feedback and professional grading structure."
        />
        <meta property="og:url" content="https://pro.essay-architect.uk/" />
        <meta property="og:image" content="https://pro.essay-architect.uk/og-image.svg" />
        <meta name="twitter:image" content="https://pro.essay-architect.uk/og-image.svg" />
        <meta
          name="keywords"
          content="IELTS writing tool, PTE essay grader, AI essay feedback, academic writing assistant, essay structure builder"
        />
      </Helmet>
      <AppHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        timer={timer.timer}
        isTimerRunning={timer.isTimerRunning}
        formatTime={timer.formatTime}
        toggleTimer={timer.toggle}
        resetTimer={timer.reset}
        user={auth.user}
        isPaid={auth.isPaid}
        activePlan={auth.activePlan}
        onLogout={auth.handleLogout}
        onShowAuth={() => modals.setShowAuth(true)}
        onShowPricing={() => modals.setShowPricing(true)}
        onShowAbout={() => modals.setShowAbout(true)}
        tourProps={tour.tourProps}
      />
      <main className="flex-1 overflow-hidden relative">
        <FeedbackButton onClick={() => modals.setShowFeedback(true)} />
        {activeTab === 'learn' ? (
          <LearnTab onGoToPractice={() => setActiveTab('practice')} />
        ) : (
          <PracticeTab
            essay={essay.essay}
            handleInputChange={essay.handleInputChange}
            totalWordCount={essay.totalWordCount}
            tourProps={tour.tourProps}
            topic={topic}
            setTopic={setTopic}
            isPaid={auth.isPaid}
            aiUsageCount={usage.aiUsageCount}
            examinerUsageCount={usage.examinerUsageCount}
            incrementFreeUsage={usage.incrementFreeUsage}
            onLimitReached={() => modals.setShowLimitModal(true)}
            onExaminerOpen={handleExaminerOpen}
            copyToClipboard={copyToClipboard}
            aiClient={aiClient}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </main>
      <AppFooter
        activeTab={activeTab}
        onShowPrivacy={() => modals.setShowPrivacy(true)}
        onShowToS={() => modals.setShowToS(true)}
      />
      <ModalsGate
        showAbout={modals.showAbout}
        showPrivacy={modals.showPrivacy}
        showAuth={modals.showAuth}
        authMode={modals.authMode}
        showExaminer={modals.showExaminer}
        showToS={modals.showToS}
        showPayment={modals.showPayment}
        showPricing={modals.showPricing}
        showLimitModal={modals.showLimitModal}
        showFeedback={modals.showFeedback}
        onCloseAbout={() => modals.setShowAbout(false)}
        onClosePrivacy={() => modals.setShowPrivacy(false)}
        onCloseAuth={() => {
          modals.setShowAuth(false);
          modals.setAuthMode('login');
        }}
        onCloseExaminer={() => modals.setShowExaminer(false)}
        onCloseToS={() => modals.setShowToS(false)}
        onClosePayment={() => modals.setShowPayment(false)}
        onClosePricing={() => modals.setShowPricing(false)}
        onCloseLimitModal={() => modals.setShowLimitModal(false)}
        onCloseFeedback={() => modals.setShowFeedback(false)}
        onAuthSuccess={(user) => auth.verifyAccess(user, true)}
        registerSessionUseCase={registerSessionUseCase}
        selectedPlan={modals.selectedPlan}
        userEmail={auth.userEmail}
        user={auth.user}
        onPaymentSuccess={() => {
          modals.setShowPayment(false);
          alert('Screenshot received! We will verify it within 1-2 hours.');
        }}
        aiClient={aiClient}
        activePlan={auth.activePlan}
        isLoggedIn={!!auth.user}
        onSelectPlan={(plan) => {
          if (!auth.user) {
            modals.setShowPricing(false);
            modals.setShowAuth(true);
          } else {
            modals.setSelectedPlan(plan);
            modals.setShowPricing(false);
            modals.setShowPayment(true);
          }
        }}
        onShowAuth={() => {
          modals.setShowPricing(false);
          modals.setShowAuth(true);
        }}
        essayText={essay.generateFullEssay()}
        isPaid={auth.isPaid}
        examinerUsageCount={usage.examinerUsageCount}
        onIncrementExaminerUsage={usage.incrementExaminerUsage}
        onExaminerLimitReached={() => {
          modals.setShowExaminer(false);
          modals.setShowLimitModal(true);
        }}
        onUpgradeFromLimit={handleUpgradeFromLimit}
        deviceService={deviceService}
      />
    </div>
  );
};

export default App;
