/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

// Essay Architect Pro Version Branch
import {
  Award,
  Clock,
  Facebook,
  Github,
  HelpCircle,
  Menu,
  PenTool,
  RefreshCw,
  RotateCcw,
  X,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';

const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

import { LogOut, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import FeedbackButton from './components/FeedbackButton';
import PreviewSection from './components/PreviewSection';
import StepWizard from './components/StepWizard';
import TestimonialSection from './components/TestimonialSection';
import TourTooltip from './components/TourTooltip';

// Lazy load modals to improve initial bundle size and FCP
const AboutModal = lazy(() => import('./components/modals/AboutModal'));
const AuthModal = lazy(() => import('./components/modals/AuthModal'));
const ExaminerModal = lazy(() => import('./components/modals/ExaminerModal'));
const FeedbackModal = lazy(() => import('./components/modals/FeedbackModal'));
const LimitExhaustedModal = lazy(() => import('./components/modals/LimitExhaustedModal'));
const PaymentModal = lazy(() => import('./components/modals/PaymentModal'));
const PricingModal = lazy(() => import('./components/modals/PricingModal'));
const PrivacyModal = lazy(() => import('./components/modals/PrivacyModal'));
const ToSModal = lazy(() => import('./components/modals/ToSModal'));
import { generateSecureToken } from '../infrastructure/security/crypto-utils';
import { DeviceService } from '../infrastructure/device/device-id';
import { RegisterSessionUseCase } from '../application/session/RegisterSessionUseCase';
import { ValidateSessionUseCase } from '../application/session/ValidateSessionUseCase';
import { DeactivateSessionUseCase } from '../application/session/DeactivateSessionUseCase';
import { AIClient } from '../infrastructure/api/api';
import { logger } from '../infrastructure/logging/logger';
import { supabase } from '../infrastructure/db/supabase';

// Service Instantiation (DI Container logic)
const deviceService = new DeviceService(logger);
const aiClient = new AIClient(supabase, logger);
const registerSessionUseCase = new RegisterSessionUseCase(supabase, deviceService, logger);
const validateSessionUseCase = new ValidateSessionUseCase(supabase, deviceService, logger);
const deactivateSessionUseCase = new DeactivateSessionUseCase(supabase, logger);

import type {
  Essay,
  EssaySectionKey,
  Notification,
  Plan,
  Topic,
  TourProps,
  User as UserType,
} from '../domain/types';

const LearnCard: React.FC<{ title: string; desc: string; number: string }> = ({
  title,
  desc,
  number,
}) => (
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

const topics = [
  {
    id: 1,
    type: 'Opinion',
    question:
      'Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree?',
  },
  {
    id: 2,
    type: 'Discussion',
    question:
      'Computers are being used more and more in education. Some say this is positive, while others argue it leads to negative consequences. Discuss both sides.',
  },
  {
    id: 3,
    type: 'Problem / Solution',
    question:
      'In many countries, the gap between the rich and the poor is becoming wider. What are the causes of this problem and what measures can be taken?',
  },
  {
    id: 4,
    type: 'Discussion',
    question:
      'Some people think that the government should invest more in public services like trains and libraries. Others believe that money should be spent on repairing roads and highways. Discuss both views and give your opinion.',
  },
  {
    id: 5,
    type: 'Advantage / Disadvantage',
    question:
      'In many countries, paying for goods and services using mobile phone apps is becoming increasingly common. Do the advantages of this trend outweigh the disadvantages?',
  },
  {
    id: 6,
    type: 'Opinion',
    question:
      "The best way to solve the world's environmental problems is to increase the price of fuel. To what extent do you agree or disagree?",
  },
  {
    id: 7,
    type: 'Direct Question',
    question:
      'Many museums and historical sites are mainly visited by tourists, but not local people. Why is this the case? What can be done to attract more local people?',
  },
  {
    id: 8,
    type: 'Opinion',
    question:
      'In the future, nobody will buy printed newspapers or books because they will be able to read everything they want online without paying. To what extent do you agree or disagree?',
  },
  {
    id: 9,
    type: 'Discussion',
    question:
      'Some people think that university students should study whatever they like. Others believe they should only be allowed to study subjects that will be useful in the future, such as science and technology. Discuss both views.',
  },
  {
    id: 10,
    type: 'Causes / Effects',
    question:
      'Nowadays many people choose to be self-employed, rather than to work for a company or organisation. Why is this the case? What could be the disadvantages of being self-employed?',
  },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('learn');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [mobilePracticeTab, setMobilePracticeTab] = useState<'wizard' | 'preview'>('wizard');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<
    'login' | 'signup' | 'forgot_password' | 'update_password'
  >('login');
  const [showExaminer, setShowExaminer] = useState<boolean>(false);
  const [showToS, setShowToS] = useState<boolean>(false);

  // Auth & Monetization State
  const [user, setUser] = useState<UserType | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [showPricing, setShowPricing] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [visitorID, setVisitorID] = useState<string | null>(null);
  const [aiUsageCount, setAiUsageCount] = useState<number>(0);
  const [examinerUsageCount, setExaminerUsageCount] = useState<number>(0);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const [tourStep, setTourStep] = useState<number>(() => {
    // Check if user has completed the tour from localStorage
    const tourCompleted = localStorage.getItem('essay-architect-tour-completed');
    return tourCompleted === 'true' ? -1 : -1; // Start at -1, will be set to 0 on first theory tab visit
  });
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() => {
    const tourCompleted = localStorage.getItem('essay-architect-tour-completed');
    return tourCompleted === 'true';
  });

  const promptRef = useRef<HTMLTextAreaElement>(null);

  const [essay, setEssay] = useState<Essay>({
    intro: { paraphrase: '', thesis: '' },
    body1: { topicSentence: '', explanation: '', example: '', concluding: '' },
    body2: { topicSentence: '', explanation: '', example: '', concluding: '' },
    conclusion: { summary: '', finalThought: '' },
  });

  const verifyAccess = useCallback(async (user: UserType | null, isSilent: boolean = false) => {
    if (!user) {
      setIsPaid(false);
      setActivePlan(null);
      setUserEmail('');
      return;
    }

    // Always set the user's email when they're logged in
    setUserEmail(user.email || '');

    try {
      // Optimized: Filter by status at DB level and limit to latest approved payment
      // Uses composite index: idx_payments_user_status_created
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Payment check fetch error:', error);
        // On network error, keep current state to avoid UI flicker
        return;
      }

      // Since we filtered at DB level, data contains only approved payments
      if (data && data.length > 0) {
        const latest = data[0];

        const createdAt = new Date(latest.created_at).getTime();
        const now = Date.now();
        const hoursPassed = (now - createdAt) / (1000 * 60 * 60);

        let isValid = false;
        let expiryMessage = '';

        if (latest.plan_name === 'Consultancy Killer' || latest.plan_name === 'Lifetime Pack') {
          isValid = true;
          expiryMessage = 'Welcome back! Your Lifetime access is active.';
          // Normalize legacy plan name for UI display
          if (latest.plan_name === 'Consultancy Killer') latest.plan_name = 'Lifetime Pack';
        } else if (latest.plan_name === 'Preparation Pack') {
          const daysLeft = Math.floor(30 - hoursPassed / 24);
          if (daysLeft >= 0) {
            isValid = true;
            expiryMessage = `Access Unlocked! You have ${daysLeft} days remaining on your Preparation Pack.`;
          } else {
            expiryMessage = 'Your 30-day Preparation Pack has expired.';
          }
        } else if (latest.plan_name === "Crammer's Pass") {
          const hoursLeft = Math.floor(24 - hoursPassed);
          if (hoursLeft >= 0) {
            isValid = true;
            expiryMessage = `Access Unlocked! You have ${hoursLeft} hours remaining on your Crammer's Pass.`;
          } else {
            expiryMessage = "Your 24-hour Crammer's Pass has expired.";
          }
        }

        if (isValid) {
          setIsPaid(true);
          setActivePlan(latest.plan_name);
          if (!isSilent) setNotification({ message: expiryMessage, type: 'success' });
        } else {
          // Plan expired
          setIsPaid(false);
          setActivePlan(null);
          if (!isSilent)
            setNotification({
              message:
                expiryMessage || 'No active plan found. Your previous plan may have expired.',
              type: 'info',
            });
        }
      } else {
        // No approved record found - Revoke access
        setIsPaid(false);
        setActivePlan(null);

        if (!isSilent) {
          setNotification({
            message:
              'No approved payment found for this email. If you just paid, please wait for manual verification (1-2 hours).',
            type: 'info',
          });
        }
      }
    } catch (err: unknown) {
      console.error('Critical verifyAccess error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      // Fail silent in silent mode, alert user otherwise
      if (!isSilent)
        setNotification({
          message: `Failed to verify access: ${message}. Please refresh the page.`,
          type: 'error',
        });
    }
  }, []);

  useEffect(() => {
    setTopic(topics[0] ?? null);
    let isLoggingOut = false; // Flag to prevent race condition

    // Handle PKCE recovery token from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const verificationType = urlParams.get('verification_type');
    const tokenHash = urlParams.get('token_hash');

    if (verificationType === 'recovery' && tokenHash) {
      // Exchange the token and open the update password modal
      supabase.auth
        .verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        })
        .then(({ error }) => {
          if (error) {
            console.error('Recovery token verification failed:', error);
            setNotification({
              message:
                'Failed to verify recovery link. It may have expired. Please request a new one.',
              type: 'error',
            });
          } else {
            // Token verified, open the update password modal
            setAuthMode('update_password');
            setShowAuth(true);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        });
    }

    // Auth Listener with two-device session validation
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Validate session against two-device limit
        const { isValid, wasLoggedOut } = await validateSessionUseCase.execute(session.user.id);

        if (wasLoggedOut) {
          // Session was invalidated manually or by a rare database event
          isLoggingOut = true;
          try {
            await supabase.auth.signOut();
          } catch (err) {
            logger.error({ err }, 'SignOut error');
          }
          setUser(null);
          setIsPaid(false);
          setUserEmail('');
          setActivePlan(null);
          setNotification({
            message: 'Your session has expired. Please log in again.',
            type: 'info',
          });
          return;
        }

        // If no session record exists, register this session
        if (!isValid && !wasLoggedOut) {
          const sessionToken = session.access_token?.substring(0, 32) || generateSecureToken(16);
          await registerSessionUseCase.execute(session.user.id, sessionToken);
        }

        setUser(session.user);
        verifyAccess(session.user, true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip if we're in the middle of a forced logout
      if (isLoggingOut) return;

      if (session) {
        // For SIGNED_IN event, session is already registered by AuthModal
        // For TOKEN_REFRESHED, validate the session
        if (event === 'TOKEN_REFRESHED') {
          const { wasLoggedOut } = await validateSessionUseCase.execute(session.user.id);
          if (wasLoggedOut) {
            isLoggingOut = true;
            try {
              await supabase.auth.signOut();
            } catch (err) {
              logger.error({ err }, 'SignOut error');
            }
            setUser(null);
            setIsPaid(false);
            setUserEmail('');
            setActivePlan(null);
            setNotification({
              message: 'Your session has expired. Please log in again.',
              type: 'info',
            });
            return;
          }
        }

        setUser(session.user);
        verifyAccess(session.user, true);
      } else {
        setUser(null);
        setIsPaid(false);
        setUserEmail('');
        setActivePlan(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update_password');
        setShowAuth(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [verifyAccess]);

  // Deferred Third-Party Analytics Initialization
  useEffect(() => {
    const initAnalytics = () => {
      // 1. Google Tag Manager
      const gtagScript = document.createElement('script');
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-63RTLLNS0T';
      gtagScript.async = true;
      document.head.appendChild(gtagScript);

      // @ts-ignore
      window.dataLayer = window.dataLayer || [];
      // @ts-ignore
      function gtag() {
        // @ts-ignore
        window.dataLayer.push(arguments);
      }
      // @ts-ignore
      gtag('js', new Date());
      // @ts-ignore
      gtag('config', 'G-63RTLLNS0T');

      // 2. Facebook Pixel
      // oxlint-disable-next-line no-unused-expressions
      void ((f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) => {
        if (f.fbq) return;
        n = f.fbq = function () {
          // oxlint-disable-next-line no-unused-expressions
          n.callMethod
            ? // biome-ignore lint/complexity/noArguments: Standard Facebook Pixel code
              n.callMethod.apply(n, arguments)
            : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      // @ts-ignore
      fbq('init', '1404059491073088');
      // @ts-ignore
      fbq('track', 'PageView');
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(initAnalytics, { timeout: 2000 });
    } else {
      setTimeout(initAnalytics, 2000);
    }
  }, []);

  // Periodic session validation - detect when this device was logged out by another device
  useEffect(() => {
    if (!user) return;

    const checkSession = async () => {
      const { wasLoggedOut } = await validateSessionUseCase.execute(user.id);
      if (wasLoggedOut) {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          logger.error({ err }, 'SignOut error during periodic check');
        }
        setUser(null);
        setIsPaid(false);
        setUserEmail('');
        setActivePlan(null);
        setNotification({
          message:
            'You have been logged out because you signed in on another device. (Two-device limit)',
          type: 'info',
        });
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'practice' && !hasSeenTour) {
      setTourStep(0);
      setHasSeenTour(true);
    }
  }, [activeTab, hasSeenTour]);

  // Auto-resize prompt textarea
  const adjustHeight = useCallback(() => {
    if (promptRef.current) {
      promptRef.current.style.height = 'auto';
      promptRef.current.style.height = `${promptRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'practice') {
      adjustHeight();
      const timer = setTimeout(adjustHeight, 10);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeTab, adjustHeight]);

  // Initialize Fingerprint and Sync Usage
  useEffect(() => {
    const initTracking = async () => {
      try {
        const vid = await deviceService.getVisitorID();
        setVisitorID(vid);

        // Fetch current usage from Supabase
        const { data, error } = await supabase
          .from('usage_tracking')
          .select('usage_count, examiner_count')
          .eq('visitor_id', vid)
          .maybeSingle();

        if (error) {
          // PGRST116 means no row found, which is handled in the 'else' block
          if (error.code !== 'PGRST116') {
            logger.error({ code: error.code, msg: error.message }, 'Usage fetch failed');
            // Fallback to 0 if record missing or inaccessible
            setAiUsageCount(0);
            setExaminerUsageCount(0);
          }
        }

        if (data) {
          setAiUsageCount(data.usage_count || 0);
          setExaminerUsageCount(data.examiner_count || 0);
        } else if (!error || error.code === 'PGRST116') {
          // Record truly doesn't exist, create it with upsert to handle race conditions
          setAiUsageCount(0);
          setExaminerUsageCount(0);
          try {
            const { error: upsertError } = await supabase.from('usage_tracking').upsert(
              [
                {
                  visitor_id: vid,
                  usage_count: 0,
                  examiner_count: 0,
                  alias: null,
                },
              ],
              {
                onConflict: 'visitor_id',
                ignoreDuplicates: true,
              },
            );
            if (upsertError) {
              logger.error({ msg: upsertError.message }, 'Failed to create initial usage record');
            }
          } catch (e) {
            logger.error({ err: e }, 'Critical error during usage sync');
          }
        }
      } catch (err) {
        logger.error({ err }, 'initTracking failed');
      }
    };
    initTracking();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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

  const getNewRandomTopic = () => {
    if (topics.length <= 1) return;
    let newTopic = topics[0] as Topic;
    do {
      newTopic = topics[Math.floor(Math.random() * topics.length)] as Topic;
    } while (newTopic.id === topic?.id);
    setTopic(newTopic ?? null);
  };

  const handleInputChange = (section: EssaySectionKey, field: string, value: string) => {
    if (!isTimerRunning) setIsTimerRunning(true);
    setEssay((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as EssaySectionKey],
        [field]: value,
      },
    }));
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuestion = e.target.value;
    setTopic((prev) =>
      prev
        ? { ...prev, question: newQuestion }
        : ({ question: newQuestion, id: 0, type: 'default' } as Topic),
    );
  };

  const generateFullEssay = () => {
    const { intro, body1, body2, conclusion } = essay;
    const text = `${intro.paraphrase} ${intro.thesis}\n\n${body1.topicSentence} ${body1.explanation} ${body1.example} ${body1.concluding}\n\n${body2.topicSentence} ${body2.explanation} ${body2.example} ${body2.concluding}\n\n${conclusion.summary} ${conclusion.finalThought}`;
    return text.replace(/\s+/g, ' ').trim() === '' ? '' : text;
  };

  const handleExaminerOpen = () => {
    if (!isPaid && examinerUsageCount >= 1) {
      setShowLimitModal(true);
      return;
    }
    setShowExaminer(true);
  };

  const handleUpgradeFromLimit = (planName: string | null) => {
    setShowLimitModal(false);

    if (planName) {
      // "Get 24h Access Now" - requires login immediately to proceed to payment
      if (!user) {
        setShowAuth(true);
        return;
      }
      const plan: Plan = {
        name: "Crammer's Pass",
        price: 'Rs. 50',
        duration: '24 Hours',
      };
      setSelectedPlan(plan);
      setShowPayment(true);
    } else {
      // "View All Plans" - show pricing modal, login not required yet
      setShowPricing(true);
    }
  };

  const incrementFreeUsage = async () => {
    if (!visitorID) return;

    const newCount = aiUsageCount + 1;
    setAiUsageCount(newCount);

    // Sync to Supabase using secure RPC
    try {
      const { error } = await supabase.rpc('increment_usage_count', {
        target_visitor_id: visitorID,
        counter_type: 'ai',
      });
      if (error) {
        console.error('RPC Error (AI Usage):', error.message, error.details);
        // Rollback local state if sync failed so user sees accurate persisted data
        setAiUsageCount((prev) => prev - 1);
      }
    } catch (err) {
      console.error('Failed to sync AI usage:', err);
      setAiUsageCount((prev) => prev - 1);
    }
  };

  const incrementExaminerUsage = async () => {
    if (!visitorID || isPaid) return;

    const newCount = examinerUsageCount + 1;
    setExaminerUsageCount(newCount);

    // Sync to Supabase using secure RPC
    try {
      const { error } = await supabase.rpc('increment_usage_count', {
        target_visitor_id: visitorID,
        counter_type: 'examiner',
      });
      if (error) {
        console.error('RPC Error (Examiner Usage):', error.message, error.details);
        setExaminerUsageCount((prev) => prev - 1);
      }
    } catch (err) {
      console.error('Failed to sync examiner usage:', err);
      setExaminerUsageCount((prev) => prev - 1);
    }
  };

  const calculateWordCount = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const totalWordCount = calculateWordCount(generateFullEssay());

  const copyToClipboard = () => {
    const text = generateFullEssay();
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      const btn = document.getElementById('copyBtn') as HTMLButtonElement | null;
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="uppercase font-black">Copied!</span>';
        setTimeout(() => (btn.innerHTML = originalText), 2000);
      }
    } catch (err) {
      console.error('Unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const handleLogout = async () => {
    try {
      // Deactivate session in database before signing out
      if (user) {
        console.log('Deactivating session for user:', user.id);
        const result = await deactivateSessionUseCase.execute(user.id);
        if (result.ok) console.log('Session deactivated successfully');
        else console.warn('Session deactivation failed:', result.error);
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Manual state reset to ensure UI updates immediately
      setUser(null);
      setIsPaid(false);
      setUserEmail('');
      setActivePlan(null);

      // Force a complete page reload to clear all library and browser states
      window.location.href = window.location.origin;
    }
  };

  return (
    <div className="h-[100dvh] bg-[#f4f1ea] text-stone-900 font-sans flex flex-col overflow-hidden selection:bg-yellow-300 selection:text-stone-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div
            className={`px-6 py-3 border-2 border-stone-900 bg-white flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
          >
            <div
              className={`w-3 h-3 ${notification.type === 'error' ? 'bg-red-500' : notification.type === 'success' ? 'bg-green-500' : 'bg-yellow-400'}`}
            ></div>
            <p className="text-sm font-bold uppercase tracking-tight">{notification.message}</p>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="ml-4 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
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
                  setShowAbout(true);
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
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-300 relative mr-4 ${activeTab === 'learn' ? 'text-stone-900 after:content-[""] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
            >
              The Guide
            </button>

            <div className="w-4 h-8 relative flex flex-col items-center justify-end">
              <TourTooltip
                stepIndex={0}
                text="Switch between The Guide (Theory) and The Wizard (Practice)."
                position="bottom"
                {...tourProps}
              />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-300 relative ml-4 ${activeTab === 'practice' ? 'text-stone-900 after:content-[""] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
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
                onClick={() => setIsTimerRunning(!isTimerRunning)}
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
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimer(0);
                }}
                className="w-6 h-6 flex items-center justify-center border border-stone-900 text-stone-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                title="Reset"
              >
                <RotateCcw size={10} />
              </button>
            </div>

            <TourTooltip
              stepIndex={2}
              text="Time is of the essence. Track it here."
              position="bottomLeft"
              {...tourProps}
            />
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
                  onClick={handleLogout}
                  className="p-2 border-2 border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-stone-900"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-stone-900 font-black uppercase text-[10px] tracking-widest bg-white text-stone-900 hover:bg-stone-900 hover:text-white transition-all"
              >
                <User size={14} /> Login / Sign Up
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPricing(true)}
                className={`flex items-center gap-2 px-4 py-2 border-2 border-stone-900 font-black uppercase text-[10px] tracking-widest transition-all ${isPaid ? 'bg-green-500 text-white border-green-600' : 'bg-yellow-400 text-stone-900 hover:bg-stone-900 hover:text-white'}`}
              >
                {isPaid ? <Award size={14} /> : <Zap size={14} />}
                {isPaid ? 'Pro Access' : 'Upgrade'}
              </button>
              <TourTooltip
                stepIndex={5}
                text="Unlock unlimited AI grading and premium features here."
                position="bottomRight"
                {...tourProps}
              />
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
                  className={`text-left p-3 border-2 ${activeTab === 'learn' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-500'} font-bold uppercase tracking-wider transition-all`}
                >
                  The Guide (Theory)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('practice');
                    setIsMenuOpen(false);
                  }}
                  className={`text-left p-3 border-2 ${activeTab === 'practice' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-500'} font-bold uppercase tracking-wider transition-all`}
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
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
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
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimer(0);
                    }}
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
                      handleLogout();
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
                    setShowAuth(true);
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
                  setShowPricing(true);
                  setIsMenuOpen(false);
                }}
                className={`flex items-center justify-center gap-2 p-3 border-2 border-stone-900 font-black uppercase text-xs tracking-widest transition-all ${isPaid ? 'bg-green-500 text-white border-green-600' : 'bg-yellow-400 text-stone-900 hover:bg-stone-900 hover:text-white'}`}
              >
                {isPaid ? <Award size={16} /> : <Zap size={16} />}
                {isPaid ? 'Pro Access Active' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        )}
      </header>

      <Suspense fallback={null}>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
        {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

        {showAuth && (
          <AuthModal
            onClose={() => {
              setShowAuth(false);
              setAuthMode('login');
            }}
            onAuthSuccess={(user) => verifyAccess(user, true)}
            initialMode={authMode}
            registerSessionUseCase={registerSessionUseCase}
          />
        )}
        {showExaminer && (
          <ExaminerModal
            isOpen={showExaminer}
            onClose={() => setShowExaminer(false)}
            essayText={generateFullEssay()}
            isPaid={isPaid}
            onIncrementUsage={incrementExaminerUsage}
            examinerUsageCount={examinerUsageCount}
            onLimitReached={() => {
              setShowExaminer(false);
              setShowLimitModal(true);
            }}
            aiClient={aiClient}
          />
        )}

        {showPricing && (
          <PricingModal
            onClose={() => setShowPricing(false)}
            activePlan={activePlan}
            isLoggedIn={!!user}
            onSelectPlan={(plan) => {
              if (!user) {
                setShowPricing(false);
                setShowAuth(true);
              } else {
                setSelectedPlan(plan);
                setShowPricing(false);
                setShowPayment(true);
              }
            }}
            onShowAuth={() => {
              setShowPricing(false);
              setShowAuth(true);
            }}
          />
        )}

        {showPayment && (
          <PaymentModal
            plan={selectedPlan as Plan}
            userEmail={userEmail}
            user={user}
            onClose={() => setShowPayment(false)}
            onSuccess={() => {
              setShowPayment(false);
              // Removed setPendingEmail (undefined) and setShowPricing (redundant)
              // User stays on current page after submission
              alert('Screenshot received! We will verify it within 1-2 hours.');
            }}
            aiClient={aiClient}
          />
        )}

        <LimitExhaustedModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          onUpgrade={handleUpgradeFromLimit}
        />

        {showFeedback && (
          <FeedbackModal
            onClose={() => setShowFeedback(false)}
            initialEmail={userEmail}
            deviceService={deviceService}
          />
        )}

        {showToS && <ToSModal onClose={() => setShowToS(false)} />}
      </Suspense>

      <main className="flex-1 overflow-hidden relative">
        <FeedbackButton onClick={() => setShowFeedback(true)} />
        {activeTab === 'learn' && (
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
                  Essay Architect Pro isn't just a wizard—it's a comprehensive training ground. Here
                  is how to get the most out of it.
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
                    Achieving a high band score in IELTS or PTE requires more than just
                    vocabulary—it requires structure. Essay Architect PRO is the specialized tool
                    that forces you to plan your essay paragraph by paragraph before you write.
                  </p>
                  <p className="font-medium leading-relaxed opacity-80">
                    Stop practicing blindly. With our{' '}
                    <strong className="font-bold text-stone-900">advanced AI examiner</strong>, you
                    receive instant feedback on your coherence, cohesion, and lexical resource,
                    tailored specifically to the marking criteria of international English exams.
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
                    Put the theory into practice with our live wizard. Real-time preview, word
                    counting, and structure enforcement included.
                  </p>
                  <button
                    onClick={() => setActiveTab('practice')}
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
                    <p className="font-serif text-xl">
                      "Discuss both views and give your opinion."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'practice' && (
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
              className={`w-full md:w-3/5 p-0 overflow-y-auto custom-scrollbar bg-[#f4f1ea] md:border-r-2 border-stone-900 ${mobilePracticeTab !== 'wizard' ? 'hidden md:block' : ''}`}
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
                      <TourTooltip
                        stepIndex={1}
                        text="This is your prompt. Auto-resizes as you type. Click 'New Prompt' to shuffle."
                        position="bottomLeft"
                        {...tourProps}
                      />
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
                  onLimitReached={() => setShowLimitModal(true)}
                  aiClient={aiClient}
                />
              </div>
            </div>

            {/* Preview Section - hidden on mobile if wizard tab is active, full height on mobile when visible */}
            <div
              className={`w-full md:w-2/5 md:h-auto border-t-2 md:border-t-0 border-stone-900 relative z-10 bg-white ${mobilePracticeTab !== 'preview' ? 'hidden md:block' : 'flex-1'}`}
            >
              <PreviewSection
                essay={essay}
                totalWordCount={totalWordCount}
                setShowExaminer={handleExaminerOpen}
                copyToClipboard={copyToClipboard}
                tourProps={tourProps}
                isPaid={isPaid}
                examinerUsageCount={examinerUsageCount}
              />
            </div>
          </div>
        )}
      </main>

      <footer
        className={`bg-[#f4f1ea] border-t-2 border-stone-900 py-3 px-6 flex flex-col md:flex-row justify-between items-center shrink-0 z-50 gap-2 fixed bottom-0 w-full md:static ${activeTab === 'practice' ? 'hidden md:flex' : ''}`}
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
            onClick={() => setShowPrivacy(true)}
            className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setShowToS(true)}
            className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
          >
            Terms of Service
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
