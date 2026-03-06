/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type React from 'react';
import { lazy, Suspense } from 'react';
import type { Plan, User as UserType } from '../../domain/types';
import type { AuthMode } from '../hooks/useModals';
import { AIClient } from '../../infrastructure/api/api';
import { DeviceService } from '../../infrastructure/device/device-id';
import { RegisterSessionUseCase } from '../../application/session/RegisterSessionUseCase';

// Lazy load modals to improve initial bundle size and FCP
const AboutModal = lazy(() => import('./modals/AboutModal'));
const AuthModal = lazy(() => import('./modals/AuthModal'));
const ExaminerModal = lazy(() => import('./modals/ExaminerModal'));
const FeedbackModal = lazy(() => import('./modals/FeedbackModal'));
const LimitExhaustedModal = lazy(() => import('./modals/LimitExhaustedModal'));
const PaymentModal = lazy(() => import('./modals/PaymentModal'));
const PricingModal = lazy(() => import('./modals/PricingModal'));
const PrivacyModal = lazy(() => import('./modals/PrivacyModal'));
const ToSModal = lazy(() => import('./modals/ToSModal'));

interface ModalsGateProps {
  // Modal visibility
  showAbout: boolean;
  showPrivacy: boolean;
  showAuth: boolean;
  authMode: AuthMode;
  showExaminer: boolean;
  showToS: boolean;
  showPayment: boolean;
  showPricing: boolean;
  showLimitModal: boolean;
  showFeedback: boolean;

  // Modal handlers
  onCloseAbout: () => void;
  onClosePrivacy: () => void;
  onCloseAuth: () => void;
  onCloseExaminer: () => void;
  onCloseToS: () => void;
  onClosePayment: () => void;
  onClosePricing: () => void;
  onCloseLimitModal: () => void;
  onCloseFeedback: () => void;

  // Auth
  onAuthSuccess: (user: UserType) => void;
  registerSessionUseCase: RegisterSessionUseCase;

  // Payment
  selectedPlan: Plan | null;
  userEmail: string;
  user: UserType | null;
  onPaymentSuccess: () => void;
  aiClient: AIClient;

  // Pricing
  activePlan: string | null;
  isLoggedIn: boolean;
  onSelectPlan: (plan: Plan) => void;
  onShowAuth: () => void;

  // Examiner
  essayText: string;
  isPaid: boolean;
  examinerUsageCount: number;
  onIncrementExaminerUsage: () => void;
  onExaminerLimitReached: () => void;

  // Limit Modal
  onUpgradeFromLimit: (planName: string | null) => void;

  // Feedback
  deviceService: DeviceService;
}

export const ModalsGate: React.FC<ModalsGateProps> = ({
  showAbout,
  showPrivacy,
  showAuth,
  authMode,
  showExaminer,
  showToS,
  showPayment,
  showPricing,
  showLimitModal,
  showFeedback,
  onCloseAbout,
  onClosePrivacy,
  onCloseAuth,
  onCloseExaminer,
  onCloseToS,
  onClosePayment,
  onClosePricing,
  onCloseLimitModal,
  onCloseFeedback,
  onAuthSuccess,
  registerSessionUseCase,
  selectedPlan,
  userEmail,
  user,
  onPaymentSuccess,
  aiClient,
  activePlan,
  isLoggedIn,
  onSelectPlan,
  onShowAuth,
  essayText,
  isPaid,
  examinerUsageCount,
  onIncrementExaminerUsage,
  onExaminerLimitReached,
  onUpgradeFromLimit,
  deviceService,
}) => {
  return (
    <Suspense fallback={null}>
      {showAbout && <AboutModal onClose={onCloseAbout} />}
      {showPrivacy && <PrivacyModal onClose={onClosePrivacy} />}

      {showAuth && (
        <AuthModal
          onClose={onCloseAuth}
          onAuthSuccess={onAuthSuccess}
          initialMode={authMode}
          registerSessionUseCase={registerSessionUseCase}
        />
      )}

      {showExaminer && (
        <ExaminerModal
          isOpen={showExaminer}
          onClose={onCloseExaminer}
          essayText={essayText}
          isPaid={isPaid}
          onIncrementUsage={onIncrementExaminerUsage}
          examinerUsageCount={examinerUsageCount}
          onLimitReached={onExaminerLimitReached}
          aiClient={aiClient}
        />
      )}

      {showPricing && (
        <PricingModal
          onClose={onClosePricing}
          activePlan={activePlan}
          isLoggedIn={isLoggedIn}
          onSelectPlan={onSelectPlan}
          onShowAuth={onShowAuth}
        />
      )}

      {showPayment && (
        <PaymentModal
          plan={selectedPlan as Plan}
          userEmail={userEmail}
          user={user}
          onClose={onClosePayment}
          onSuccess={onPaymentSuccess}
          aiClient={aiClient}
        />
      )}

      <LimitExhaustedModal
        isOpen={showLimitModal}
        onClose={onCloseLimitModal}
        onUpgrade={onUpgradeFromLimit}
      />

      {showFeedback && (
        <FeedbackModal onClose={onCloseFeedback} initialEmail={userEmail} deviceService={deviceService} />
      )}

      {showToS && <ToSModal onClose={onCloseToS} />}
    </Suspense>
  );
};
