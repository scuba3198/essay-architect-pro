/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { Result, ok, err } from '../../domain/result';
import { AppError, AuthenticationError, NetworkError } from '../../domain/error';
import { generateCorrelationId } from '../logging/correlation';
import { getTurnstileToken } from '../security/turnstile';

/**
 * Client for interacting with the Pro AI Engine.
 * RATIONALE: Encapsulating API logic in a class allows for clean dependency injection
 * and consistent error handling across all AI interactions.
 */
export class AIClient {
  /**
   * @param {SupabaseClient} supabase - Supabase client for auth session
   * @param {Logger} logger - Injected pino logger
   */
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: Logger,
  ) {}

  /**
   * Calls the secure AI API proxy.
   * RATIONALE: Using a server-side proxy prevents exposing AI provider API keys in the browser.
   * @param {string} prompt - The user prompt
   * @param {string} systemInstruction - System instructions for the AI
   * @param {string} type - Request type (e.g., 'completion', 'critique')
   * @returns {Promise<Result<string, AppError>>} - Result containing AI response or error
   */
  public async callProAI(
    prompt: string,
    systemInstruction: string = '',
    type: string = 'completion',
  ): Promise<Result<string, AppError>> {
    const correlationId = generateCorrelationId();
    const log = this.logger.child({ correlationId, type });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      };

      // Check if user is logged in
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

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
              'Bot verification unavailable (possibly blocked by your network/firewall). Please try a different network or log in to continue.',
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
          return err(
            new AuthenticationError('Authentication required. Please log in to continue.'),
          );
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
  }
}
