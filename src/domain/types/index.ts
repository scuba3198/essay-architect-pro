// ─── Essay Data Model ────────────────────────────────────
export interface EssayIntro {
  paraphrase: string;
  thesis: string;
}

export interface EssayBody {
  topicSentence: string;
  explanation: string;
  example: string;
  concluding: string;
}

export interface EssayConclusion {
  summary: string;
  finalThought: string;
}

export interface Essay {
  intro: EssayIntro;
  body1: EssayBody;
  body2: EssayBody;
  conclusion: EssayConclusion;
}

// Section / field key unions (for handleInputChange)
export type EssaySectionKey = keyof Essay;

// ─── Topic Model ─────────────────────────────────────────
export interface Topic {
  id: number;
  type: string;
  question: string;
}

// ─── Notification ────────────────────────────────────────
export type NotificationType = 'info' | 'error' | 'success';

export interface Notification {
  message: string;
  type: NotificationType;
}

// ─── Pricing / Payment ──────────────────────────────────
export interface Plan {
  name: string;
  price: string;
  duration: string;
}

// ─── Tour Props ──────────────────────────────────────────
export interface TourProps {
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
  totalSteps: number;
}

// ─── Session Manager Types ───────────────────────────────
export interface SessionResult {
  success: boolean;
  error?: string;
}

export interface SessionValidation {
  isValid: boolean;
  wasLoggedOut: boolean;
}

// ─── Supabase User (re-export convenience) ───────────────
export type { User } from '@supabase/supabase-js';
