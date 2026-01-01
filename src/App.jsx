/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
// Essay Architect Pro Version Branch
import { BookOpen, PenTool, RefreshCw, Clock, RotateCcw, HelpCircle, Award, Zap, Github, Facebook, Menu, X } from 'lucide-react';

const WhatsAppIcon = ({ size = 24, className = "" }) => (
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
import ExaminerModal from './components/modals/ExaminerModal';
import AboutModal from './components/modals/AboutModal';
import PricingModal from './components/modals/PricingModal';
import PaymentModal from './components/modals/PaymentModal';
import LimitExhaustedModal from './components/modals/LimitExhaustedModal';
import StepWizard from './components/StepWizard';
import PreviewSection from './components/PreviewSection';
import TourTooltip from './components/TourTooltip';
import FeedbackButton from './components/FeedbackButton';
import FeedbackModal from './components/modals/FeedbackModal';
import { supabase } from './lib/supabase';
import { getVisitorID } from './lib/device-id';
import { validateSession, deactivateCurrentSession, registerSession } from './lib/sessionManager';

import PrivacyModal from './components/modals/PrivacyModal';
import AuthModal from './components/modals/AuthModal';
import { Helmet } from 'react-helmet-async';
import { LogOut, User } from 'lucide-react';
import TestimonialSection from './components/TestimonialSection';
import ToSModal from './components/modals/ToSModal';
import MobileExperienceModal from './components/modals/MobileExperienceModal';

const LearnCard = ({ title, desc, number }) => (
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

const App = () => {
    const [activeTab, setActiveTab] = useState('learn');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [topic, setTopic] = useState(null);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showExaminer, setShowExaminer] = useState(false);
    const [showToS, setShowToS] = useState(false);
    const [showMobileWarning, setShowMobileWarning] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                // Check if user has already dismissed it in this session (optional, but good UX)
                // For now, simple implementation as requested:
                const hasSeenWarning = sessionStorage.getItem('hasSeenMobileWarning');
                if (!hasSeenWarning) {
                    setShowMobileWarning(true);
                }
            }
        };

        // Check on mount
        handleResize();

        // Optional: Listen for resize if testing responsiveness dynamically
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auth & Monetization State
    const [user, setUser] = useState(null);
    const [isPaid, setIsPaid] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [activePlan, setActivePlan] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [visitorID, setVisitorID] = useState(null);
    const [aiUsageCount, setAiUsageCount] = useState(0);
    const [examinerUsageCount, setExaminerUsageCount] = useState(0);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const [tourStep, setTourStep] = useState(-1);
    const [hasSeenTour, setHasSeenTour] = useState(false);

    const promptRef = useRef(null);

    const [essay, setEssay] = useState({
        intro: { paraphrase: '', thesis: '' },
        body1: { topicSentence: '', explanation: '', example: '', concluding: '' },
        body2: { topicSentence: '', explanation: '', example: '', concluding: '' },
        conclusion: { summary: '', finalThought: '' }
    });

    const topics = [
        { id: 1, type: "Opinion", question: "Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree?" },
        { id: 2, type: "Discussion", question: "Computers are being used more and more in education. Some say this is positive, while others argue it leads to negative consequences. Discuss both sides." },
        { id: 3, type: "Problem / Solution", question: "In many countries, the gap between the rich and the poor is becoming wider. What are the causes of this problem and what measures can be taken?" },
        { id: 4, type: "Discussion", question: "Some people think that the government should invest more in public services like trains and libraries. Others believe that money should be spent on repairing roads and highways. Discuss both views and give your opinion." },
        { id: 5, type: "Advantage / Disadvantage", question: "In many countries, paying for goods and services using mobile phone apps is becoming increasingly common. Do the advantages of this trend outweigh the disadvantages?" },
        { id: 6, type: "Opinion", question: "The best way to solve the world's environmental problems is to increase the price of fuel. To what extent do you agree or disagree?" },
        { id: 7, type: "Direct Question", question: "Many museums and historical sites are mainly visited by tourists, but not local people. Why is this the case? What can be done to attract more local people?" },
        { id: 8, type: "Opinion", question: "In the future, nobody will buy printed newspapers or books because they will be able to read everything they want online without paying. To what extent do you agree or disagree?" },
        { id: 9, type: "Discussion", question: "Some people think that university students should study whatever they like. Others believe they should only be allowed to study subjects that will be useful in the future, such as science and technology. Discuss both views." },
        { id: 10, type: "Causes / Effects", question: "Nowadays many people choose to be self-employed, rather than to work for a company or organisation. Why is this the case? What could be the disadvantages of being self-employed?" }
    ];

    const verifyAccess = async (email, isSilent = false) => {
        if (!email) {
            setIsPaid(false);
            setActivePlan(null);
            setUserEmail('');
            return;
        }

        // Always set the user's email when they're logged in
        setUserEmail(email);

        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('user_email', email)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter for 'approved' status case-insensitively
            const approvedPayments = data?.filter(p => p.status?.toLowerCase() === 'approved') || [];

            if (approvedPayments.length > 0) {
                const latest = approvedPayments[0];
                const createdAt = new Date(latest.created_at).getTime();
                const now = new Date().getTime();
                const hoursPassed = (now - createdAt) / (1000 * 60 * 60);

                let isValid = false;
                let expiryMessage = "";

                if (latest.plan_name === "Consultancy Killer" || latest.plan_name === "Lifetime Pack") {
                    isValid = true;
                    expiryMessage = "Welcome back! Your Lifetime access is active.";
                    // Normalize legacy plan name for UI display
                    if (latest.plan_name === "Consultancy Killer") latest.plan_name = "Lifetime Pack";
                } else if (latest.plan_name === "Preparation Pack") {
                    const daysLeft = Math.floor(30 - (hoursPassed / 24));
                    if (daysLeft >= 0) {
                        isValid = true;
                        expiryMessage = `Access Unlocked! You have ${daysLeft} days remaining on your Preparation Pack.`;
                    } else {
                        expiryMessage = "Your 30-day Preparation Pack has expired.";
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
                    if (!isSilent) alert(expiryMessage);
                } else {
                    // Plan expired
                    setIsPaid(false);
                    setActivePlan(null);
                    if (!isSilent) alert(expiryMessage || "No active plan found. Your previous plan may have expired.");
                }
            } else {
                // No approved record found - Revoke access
                setIsPaid(false);
                setActivePlan(null);

                if (!isSilent) {
                    alert("No approved payment found for this email. If you just paid, please wait for manual verification (1-2 hours).");
                }
            }
        } catch (err) {
            console.error("Access check failed details:", err);
            const errorMsg = err.message || "Unknown error";
            if (!isSilent) alert(`Failed to verify access: ${errorMsg}. Please check console for details.`);
        }
    };

    useEffect(() => {
        setTopic(topics[0]);
        let isLoggingOut = false; // Flag to prevent race condition

        // Auth Listener with two-device session validation
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                // Validate session against two-device limit
                const { isValid, wasLoggedOut } = await validateSession(session.user.id);

                if (wasLoggedOut) {
                    // Session was invalidated by login from another device
                    isLoggingOut = true;
                    try {
                        await supabase.auth.signOut();
                    } catch (err) {
                        console.error("SignOut error:", err);
                    }
                    // Directly clear state - don't rely only on onAuthStateChange
                    setUser(null);
                    setIsPaid(false);
                    setUserEmail('');
                    setActivePlan(null);
                    alert("You've been logged out because you logged in on another device. (Max 2 devices allowed)");
                    return;
                }

                // If no session record exists, register this session
                if (!isValid && !wasLoggedOut) {
                    const sessionToken = session.access_token?.substring(0, 32) || Date.now().toString();
                    await registerSession(session.user.id, sessionToken);
                }

                setUser(session.user);
                verifyAccess(session.user.email, true);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Skip if we're in the middle of a forced logout
            if (isLoggingOut) return;

            if (session) {
                // For SIGNED_IN event, session is already registered by AuthModal
                // For TOKEN_REFRESHED, validate the session
                if (event === 'TOKEN_REFRESHED') {
                    const { isValid, wasLoggedOut } = await validateSession(session.user.id);
                    if (wasLoggedOut) {
                        isLoggingOut = true;
                        try {
                            await supabase.auth.signOut();
                        } catch (err) {
                            console.error("SignOut error:", err);
                        }
                        setUser(null);
                        setIsPaid(false);
                        setUserEmail('');
                        setActivePlan(null);
                        alert("You've been logged out because you logged in on another device. (Max 2 devices allowed)");
                        return;
                    }
                }

                setUser(session.user);
                verifyAccess(session.user.email, true);
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
    }, []);

    useEffect(() => {
        if (activeTab === 'practice' && !hasSeenTour) {
            setTourStep(0);
            setHasSeenTour(true);
        }
    }, [activeTab]);

    // Auto-resize prompt textarea
    const adjustHeight = () => {
        if (promptRef.current) {
            promptRef.current.style.height = 'auto';
            promptRef.current.style.height = promptRef.current.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        if (activeTab === 'practice') {
            adjustHeight();
            const timer = setTimeout(adjustHeight, 10);
            return () => clearTimeout(timer);
        }
    }, [activeTab, topic]);

    // Initialize Fingerprint and Sync Usage
    useEffect(() => {
        const initTracking = async () => {
            const vid = await getVisitorID();
            setVisitorID(vid);

            // Fetch current usage from Supabase
            const { data, error } = await supabase
                .from('usage_tracking')
                .select('usage_count, examiner_count')
                .eq('visitor_id', vid)
                .single();

            if (data) {
                setAiUsageCount(data.usage_count || 0);
                setExaminerUsageCount(data.examiner_count || 0);
            } else if (!error) {
                // Create record if not exists
                await supabase
                    .from('usage_tracking')
                    .insert([{ visitor_id: vid, usage_count: 0, examiner_count: 0 }]);
            }
        };
        initTracking();
    }, []);

    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const nextTourStep = () => {
        if (tourStep < 5) {
            setTourStep(tourStep + 1);
        } else {
            setTourStep(-1);
        }
    };

    const skipTour = () => {
        setTourStep(-1);
    };

    const tourProps = {
        currentStep: tourStep,
        onNext: nextTourStep,
        onSkip: skipTour,
        totalSteps: 6
    };

    const getNewRandomTopic = () => {
        if (topics.length <= 1) return;
        let newTopic;
        do {
            newTopic = topics[Math.floor(Math.random() * topics.length)];
        } while (newTopic.id === topic?.id);
        setTopic(newTopic);
    };

    const handleInputChange = (section, field, value) => {
        if (!isTimerRunning) setIsTimerRunning(true);
        setEssay(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleTopicChange = (e) => {
        if (!isTimerRunning) setIsTimerRunning(true);
        const newQuestion = e.target.value;
        setTopic(prev => ({ ...prev, question: newQuestion }));
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

    const handleUpgradeFromLimit = (planName) => {
        setShowLimitModal(false);

        if (planName) {
            // "Get 24h Access Now" - requires login immediately to proceed to payment
            if (!user) {
                setShowAuth(true);
                return;
            }
            const plan = {
                name: "Crammer's Pass",
                price: "Rs. 50",
                duration: "24 Hours"
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

        // Sync to Supabase
        await supabase
            .from('usage_tracking')
            .upsert({ visitor_id: visitorID, usage_count: newCount }, { onConflict: 'visitor_id' });
    };

    const incrementExaminerUsage = async () => {
        if (!visitorID || isPaid) return;

        const newCount = examinerUsageCount + 1;
        setExaminerUsageCount(newCount);

        // Sync to Supabase
        await supabase
            .from('usage_tracking')
            .upsert({ visitor_id: visitorID, examiner_count: newCount }, { onConflict: 'visitor_id' });
    };

    const calculateWordCount = (text) => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const totalWordCount = calculateWordCount(generateFullEssay());

    const copyToClipboard = () => {
        const text = generateFullEssay();
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const btn = document.getElementById('copyBtn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span class="uppercase font-black">Copied!</span>';
                setTimeout(() => btn.innerHTML = originalText, 2000);
            }
        } catch (err) {
            console.error('Unable to copy', err);
        }
        document.body.removeChild(textArea);
    };

    return (
        <div className="h-[100dvh] bg-[#f4f1ea] text-stone-900 font-sans flex flex-col overflow-hidden selection:bg-yellow-300 selection:text-stone-900">
            <Helmet>
                <title>{activeTab === 'learn' ? 'Essay Architect PRO • Master Academic Writing' : 'Essay Architect PRO • AI Writing Wizard'}</title>
                <meta name="description" content="The ultimate AI-powered essay writing and grading tool for IELTS and PTE. Practice with instant feedback, strict scoring, and structural guidance." />
                <link rel="canonical" href="https://pro.essay-architect.uk/" />
                <meta property="og:title" content="Essay Architect PRO - AI Essay Writing & Grading" />
                <meta property="og:description" content="Master your essay writing with real-time AI feedback and professional grading structure." />
                <meta property="og:url" content="https://pro.essay-architect.uk/" />
                <meta property="og:image" content="https://pro.essay-architect.uk/og-image.svg" />
                <meta name="twitter:image" content="https://pro.essay-architect.uk/og-image.svg" />
                <meta name="keywords" content="IELTS writing tool, PTE essay grader, AI essay feedback, academic writing assistant, essay structure builder" />
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAbout(true);
                                }}
                                className="text-stone-400 hover:text-stone-900 transition-colors"
                            >
                                <HelpCircle size={18} />
                            </button>
                        </h1>
                        <p className="hidden md:block text-[10px] font-bold text-stone-500 tracking-widest uppercase mt-1">v0.3.0 • IELTS & PTE Edition</p>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8 shrink-0">
                    <div className="flex items-center">
                        <button
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
                            onClick={() => setActiveTab('practice')}
                            className={`text-sm font-bold uppercase tracking-wider transition-all duration-300 relative ml-4 ${activeTab === 'practice' ? 'text-stone-900 after:content-[""] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            The Wizard
                        </button>
                    </div>

                    <div className="flex items-center gap-3 border-l-2 border-stone-300 pl-6 relative">
                        <div className="flex items-center gap-2 text-stone-900">
                            <Clock size={16} strokeWidth={3} className={isTimerRunning ? 'text-red-500 animate-pulse' : 'text-stone-400'} />
                            <span className="font-mono font-bold w-[3rem] text-center text-sm">{formatTime(timer)}</span>
                        </div>

                        <div className="flex gap-1">
                            <button
                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                                className={`w-6 h-6 flex items-center justify-center border border-stone-900 hover:bg-stone-900 hover:text-white transition-colors`}
                                title={isTimerRunning ? "Pause" : "Start"}
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
                                onClick={() => { setIsTimerRunning(false); setTimer(0); }}
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
                                        {user.user_metadata?.full_name || user.email}
                                    </span>
                                    {isPaid && <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                                        <Zap size={8} fill="currentColor" /> {activePlan}
                                    </span>}
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            // Deactivate session in database before signing out
                                            if (user) {
                                                await deactivateCurrentSession(user.id);
                                            }
                                            await supabase.auth.signOut();
                                        } catch (err) {
                                            console.error("Logout error:", err);
                                        } finally {
                                            // Manual state reset to ensure UI updates immediately
                                            setUser(null);
                                            setIsPaid(false);
                                            setUserEmail('');
                                            setActivePlan(null);
                                        }
                                    }}
                                    className="p-2 border-2 border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-stone-900"
                                    title="Logout"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAuth(true)}
                                className="flex items-center gap-2 px-4 py-2 border-2 border-stone-900 font-black uppercase text-[10px] tracking-widest bg-white text-stone-900 hover:bg-stone-900 hover:text-white transition-all"
                            >
                                <User size={14} /> Login / Sign Up
                            </button>
                        )}
                        <button
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

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-stone-900 p-2 shrink-0"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-[#f4f1ea] border-b-2 border-stone-900 z-40 flex flex-col p-6 gap-6 shadow-xl animate-in slide-in-from-top-5 max-h-[calc(100dvh-5rem)] overflow-y-auto pb-10">
                        <div className="flex flex-col gap-4 border-b border-stone-300 pb-6">
                            <div className="flex items-center justify-between">
                                <span className="font-serif font-bold text-lg">Navigation</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => { setActiveTab('learn'); setIsMenuOpen(false); }}
                                    className={`text-left p-3 border-2 ${activeTab === 'learn' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-500'} font-bold uppercase tracking-wider transition-all`}
                                >
                                    The Guide (Theory)
                                </button>
                                <button
                                    onClick={() => { setActiveTab('practice'); setIsMenuOpen(false); }}
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
                                    <Clock size={20} strokeWidth={3} className={isTimerRunning ? 'text-red-500 animate-pulse' : 'text-stone-400'} />
                                    <span className="font-mono font-bold text-xl">{formatTime(timer)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
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
                                        onClick={() => { setIsTimerRunning(false); setTimer(0); }}
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
                                                {user.user_metadata?.full_name || user.email}
                                            </span>
                                            {isPaid && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                <Zap size={10} fill="currentColor" /> {activePlan}
                                            </span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setIsMenuOpen(false);
                                            try {
                                                // Deactivate session in database before signing out
                                                if (user) {
                                                    await deactivateCurrentSession(user.id);
                                                }
                                                await supabase.auth.signOut();
                                            } catch (err) {
                                                console.error("Logout error:", err);
                                            } finally {
                                                setUser(null);
                                                setIsPaid(false);
                                                setUserEmail('');
                                                setActivePlan(null);
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 p-3 border-2 border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-stone-900 font-bold uppercase tracking-widest text-xs"
                                    >
                                        <LogOut size={16} /> Logout
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => { setShowAuth(true); setIsMenuOpen(false); }}
                                    className="flex items-center justify-center gap-2 p-3 border-2 border-stone-900 font-black uppercase text-xs tracking-widest bg-white text-stone-900 hover:bg-stone-900 hover:text-white transition-all"
                                >
                                    <User size={16} /> Login / Sign Up
                                </button>
                            )}
                            <button
                                onClick={() => { setShowPricing(true); setIsMenuOpen(false); }}
                                className={`flex items-center justify-center gap-2 p-3 border-2 border-stone-900 font-black uppercase text-xs tracking-widest transition-all ${isPaid ? 'bg-green-500 text-white border-green-600' : 'bg-yellow-400 text-stone-900 hover:bg-stone-900 hover:text-white'}`}
                            >
                                {isPaid ? <Award size={16} /> : <Zap size={16} />}
                                {isPaid ? 'Pro Access Active' : 'Upgrade to Pro'}
                            </button>
                        </div>
                    </div>
                )}
            </header>



            {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
            {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
            {showMobileWarning && <MobileExperienceModal isOpen={showMobileWarning} onClose={() => {
                setShowMobileWarning(false);
                sessionStorage.setItem('hasSeenMobileWarning', 'true');
            }} />}
            {showAuth && <AuthModal onClose={() => { setShowAuth(false); setAuthMode('login'); }} onAuthSuccess={(user) => verifyAccess(user.email, true)} initialMode={authMode} />}
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
                    plan={selectedPlan}
                    userEmail={userEmail}
                    onClose={() => setShowPayment(false)}
                    onSuccess={(email) => {
                        setShowPayment(false);
                        // Removed setPendingEmail (undefined) and setShowPricing (redundant)
                        // User stays on current page after submission
                        alert("Screenshot received! We will verify it within 1-2 hours.");
                    }}
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
                />
            )}

            {showToS && <ToSModal onClose={() => setShowToS(false)} />}

            <main className="flex-1 overflow-hidden relative">
                <FeedbackButton onClick={() => setShowFeedback(true)} />
                {activeTab === 'learn' && (
                    <div className="h-full overflow-y-auto custom-scrollbar bg-[#f4f1ea] pb-28 md:pb-0">
                        <div className="max-w-7xl mx-auto p-12">
                            <div className="mb-16 border-b-4 border-stone-900 pb-12">
                                <h2 className="text-5xl sm:text-7xl md:text-8xl font-black font-serif text-stone-900 mb-6 tracking-tighter leading-[0.8]">
                                    MASTER <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-800 to-stone-600" style={{ WebkitTextStroke: '2px #1c1917' }}>THE</span> <br />
                                    ARCHITECT PRO
                                </h2>
                                <p className="text-stone-900 text-xl font-serif max-w-2xl border-l-4 border-yellow-400 pl-6 italic">
                                    Essay Architect Pro isn't just a wizard—it's a comprehensive training ground. Here is how to get the most out of it.
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
                                    <h3 className="font-serif font-bold text-2xl mb-4">The Ultimate IELTS & PTE Writing Tool</h3>
                                    <p className="font-medium leading-relaxed opacity-80 mb-6">
                                        Achieving a high band score in IELTS or PTE requires more than just vocabulary—it requires structure.
                                        Essay Architect PRO is the specialized tool that forces you to plan your essay paragraph by paragraph
                                        before you write.
                                    </p>
                                    <p className="font-medium leading-relaxed opacity-80">
                                        Stop practicing blindly. With our <strong className="font-bold text-stone-900">advanced AI examiner</strong>,
                                        you receive instant feedback on your coherence, cohesion, and lexical resource, tailored specifically
                                        to the marking criteria of international English exams.
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
                                            <span>Master opinion, discussion, and advantage/disadvantage essay types.</span>
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
                                    <h3 className="font-serif font-black text-4xl mb-4">Ready to draft your first piece?</h3>
                                    <p className="text-stone-400 mb-8 max-w-md">Put the theory into practice with our live wizard. Real-time preview, word counting, and structure enforcement included.</p>
                                    <button
                                        onClick={() => setActiveTab('practice')}
                                        className="bg-yellow-400 text-stone-900 px-8 py-4 font-black uppercase tracking-widest hover:bg-white transition-colors"
                                    >
                                        Start Writing
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="border border-stone-700 p-4">
                                        <span className="text-yellow-400 font-bold uppercase text-xs tracking-wider mb-1 block">Opinion Essays</span>
                                        <p className="font-serif text-xl">"To what extent do you agree?"</p>
                                    </div>
                                    <div className="border border-stone-700 p-4">
                                        <span className="text-yellow-400 font-bold uppercase text-xs tracking-wider mb-1 block">Discussion Essays</span>
                                        <p className="font-serif text-xl">"Discuss both views and give your opinion."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {
                    activeTab === 'practice' && (
                        <div className="flex flex-col md:flex-row h-full">
                            <div className="w-full md:w-3/5 p-0 overflow-y-auto custom-scrollbar bg-[#f4f1ea] border-r-2 border-stone-900">
                                <div className="p-8 pb-4">
                                    <div className="border-2 border-stone-900 bg-white p-6 relative shadow-[8px_8px_0px_0px_rgba(28,25,23,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] transition-shadow duration-300">
                                        <div className="flex justify-between items-start mb-4 border-b border-stone-200 pb-4">
                                            <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                                Topic: {topic?.type}
                                            </span>
                                            <div className="relative z-20">
                                                <button
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
                                                className={`w-full text-stone-900 font-serif font-bold leading-tight bg-transparent border-0 p-0 resize-none outline-none placeholder:text-stone-300 overflow-hidden ${(topic?.question?.length || 0) > 150 ? 'text-xs' : (topic?.question?.length || 0) > 80 ? 'text-sm' : 'text-lg'
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
                                        onOpenPricing={() => setShowPricing(true)}
                                        freeUsageCount={aiUsageCount}
                                        onIncrementUsage={incrementFreeUsage}
                                        onLimitReached={() => setShowLimitModal(true)}
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-2/5 h-80 md:h-auto border-t-2 md:border-t-0 border-stone-900 relative z-10 bg-white">
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
                    )
                }
            </main >

            <footer className="bg-[#f4f1ea] border-t-2 border-stone-900 py-3 px-6 flex flex-col md:flex-row justify-between items-center shrink-0 z-50 gap-2 fixed bottom-0 w-full md:static">
                <div className="flex items-center gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        Architected by <a href="https://scuba3198.github.io/mumukshu-portfolio/" target="_blank" rel="noopener noreferrer" className="text-stone-900 font-black border-b-2 border-yellow-400 hover:bg-yellow-400 transition-colors cursor-pointer">Mumukshu D.C.</a>
                    </p>
                    <div className="flex items-center gap-3">
                        <a href="https://wa.me/9779862329617" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-green-500 transition-colors" aria-label="WhatsApp">
                            <WhatsAppIcon size={16} />
                        </a>
                        <a href="https://github.com/scuba3198" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-900 transition-colors" aria-label="GitHub">
                            <Github size={16} />
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61585812331891" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-blue-600 transition-colors" aria-label="Facebook">
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
        </div >
    );
};

export default App;
