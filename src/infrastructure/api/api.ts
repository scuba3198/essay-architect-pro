/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 */

import { supabase } from '../db/supabase';
import { getTurnstileToken } from '../security/turnstile';

// --- API Helper ---
// Calls the secure server-side proxy instead of Gemini directly
// The API key is stored server-side and never exposed to the browser

/**
 * Call the AI API with proper authentication
 * - Logged-in users: Uses Supabase JWT
 * - Anonymous users: Uses Cloudflare Turnstile verification
 */
import { Result, ok, err } from '../../domain/result';
import { AppError, AuthenticationError, NetworkError } from '../../domain/error';
import { logger } from '../logging/logger';
import { generateCorrelationId } from '../logging/correlation';

/**
 * Call the AI API with proper authentication
 * - Logged-in users: Uses Supabase JWT
 * - Anonymous users: Uses Cloudflare Turnstile verification
 */
export const callProAI = async (
  prompt: string,
  systemInstruction: string = '',
  type: string = 'completion',
): Promise<Result<string, AppError>> => {
  const correlationId = generateCorrelationId();
  const log = logger.child({ correlationId, type });

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
    };

    // Check if user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      // Logged-in user: send JWT
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // Anonymous user: get Turnstile token
      try {
        const turnstileToken = await getTurnstileToken();
        headers['X-Turnstile-Token'] = turnstileToken;
      } catch (turnstileError) {
        log.error({ err: turnstileError }, 'Turnstile verification failed');
        return err(
          new AppError(
            'Bot verification unavailable (network restriction). Please log in to continue.',
            'TURNSTILE_ERROR',
            true,
          ),
        );
      }
    }

    log.debug('Calling AI API');
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, systemInstruction, type }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (response.status === 401) {
        log.warn('Authentication failed');
        return err(new AuthenticationError('Authentication required. Please log in to continue.'));
      }
      if (response.status === 429) {
        log.warn('Rate limit exceeded');
        return err(
          new AppError(
            'Too many requests. Please wait a moment before trying again.',
            'RATE_LIMIT',
            false,
          ),
        );
      }
      if (response.status === 503) {
        log.warn('Service maintenance');
        return err(
          new AppError(
            'Pro AI services are currently undergoing maintenance. Please contact support.',
            'MAINTENANCE',
            false,
          ),
        );
      }
      log.error({ status: response.status, errorData }, 'API Error');
      return err(
        new AppError(errorData.error || `AI Engine Error: ${response.status}`, 'API_ERROR', true),
      );
    }

    const data = await response.json();
    if (!data.text) {
      log.error('Empty response from AI');
      return err(new AppError('AI returned empty response', 'EMPTY_RESPONSE', true));
    }

    log.info('AI request successful');
    return ok(data.text);
  } catch (error) {
    log.error({ err: error }, 'Pro AI Engine network failure');
    return err(new NetworkError(error instanceof Error ? error.message : 'Network failure'));
  }
};
