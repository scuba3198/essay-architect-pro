/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 */

import { Effect } from 'effect';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../../domain/error';
import { generateCorrelationId } from '../logging/correlation';
import { getTurnstileToken } from '../security/turnstile';

/**
 * Client for interacting with the Pro AI Engine.
 * RATIONALE: Encapsulating API logic in a class allows for clean dependency injection.
 */
export class AIClient {
  /**
   * @param {SupabaseClient} supabase - Supabase client for auth session
   */
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Calls the secure AI API proxy.
   * RATIONALE: Using a server-side proxy prevents exposing AI provider API keys in the browser.
   * @param {string} prompt - The user prompt
   * @param {string} systemInstruction - System instructions for the AI
   * @param {string} type - Request type (e.g., 'completion', 'critique')
   * @returns {Effect.Effect<string, AppError>} - Effect containing AI response or error
   */
  public callProAI(
    prompt: string,
    systemInstruction: string = '',
    type: string = 'completion',
  ): Effect.Effect<string, AppError> {
    const correlationId = generateCorrelationId();

    const program = Effect.gen(this, function* () {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      };

      // Check if user is logged in
      const { data: sessionData } = yield* Effect.tryPromise({
        try: () => this.supabase.auth.getSession(),
        catch: () =>
          new AppError({
            message: 'Failed to access session',
            code: 'SESSION_ERROR',
            shouldLog: true,
          }),
      });

      const session: Session | null = sessionData.session;

      if (session?.access_token) {
        // Logged-in user: send JWT
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // Anonymous user: get Turnstile token
        const turnstileToken = yield* getTurnstileToken().pipe(
          Effect.tapError((turnstileError) =>
            Effect.logError('Turnstile verification failed', { error: turnstileError }),
          ),
          Effect.mapError(() => {
            return new AppError({
              message:
                'Bot verification unavailable (possibly blocked by your network/firewall). Please try a different network or log in to continue.',
              code: 'TURNSTILE_ERROR',
              shouldLog: true,
            });
          }),
        );
        headers['X-Turnstile-Token'] = turnstileToken;
      }

      yield* Effect.logDebug('Calling AI API');

      const response = yield* Effect.tryPromise({
        try: () =>
          fetch('/api/ai', {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt, systemInstruction, type }),
          }),
        catch: (error) => {
          return new AppError({
            message: error instanceof Error ? error.message : 'Network failure',
            code: 'NETWORK_ERROR',
            shouldLog: true,
          });
        },
      });

      if (!response.ok) {
        const errorData = (yield* Effect.tryPromise({
          try: () => response.json().catch(() => ({})),
          catch: () => new AppError({ message: 'JSON parsing failed', code: 'PARSE_ERROR' }),
        })) as { error?: string };

        if (response.status === 401) {
          yield* Effect.logWarning('Authentication failed');
          return yield* Effect.fail(
            new AppError({
              message: 'Authentication required. Please log in to continue.',
              code: 'AUTH_ERROR',
              shouldLog: false,
            }),
          );
        }
        if (response.status === 429) {
          yield* Effect.logWarning('Rate limit exceeded');
          return yield* Effect.fail(
            new AppError({
              message: 'Too many requests. Please wait a moment before trying again.',
              code: 'RATE_LIMIT',
              shouldLog: false,
            }),
          );
        }
        if (response.status === 503) {
          yield* Effect.logWarning('Service maintenance');
          return yield* Effect.fail(
            new AppError({
              message:
                'Pro AI services are currently undergoing maintenance. Please contact support.',
              code: 'MAINTENANCE',
              shouldLog: false,
            }),
          );
        }

        yield* Effect.logError('API Error').pipe(
          Effect.annotateLogs({ status: response.status, errorData }),
        );
        return yield* Effect.fail(
          new AppError({
            message: errorData.error || `AI Engine Error: ${response.status}`,
            code: 'API_ERROR',
            shouldLog: true,
          }),
        );
      }

      const data = (yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () =>
          new AppError({
            message: 'Failed to parse JSON response',
            code: 'PARSE_ERROR',
            shouldLog: true,
          }),
      })) as { text?: string };

      if (!data.text) {
        yield* Effect.logError('Empty response from AI');
        return yield* Effect.fail(
          new AppError({
            message: 'AI returned empty response',
            code: 'EMPTY_RESPONSE',
            shouldLog: true,
          }),
        );
      }

      yield* Effect.logInfo('AI request successful');
      return data.text;
    });

    return program.pipe(Effect.annotateLogs({ correlationId, type }));
  }
}
