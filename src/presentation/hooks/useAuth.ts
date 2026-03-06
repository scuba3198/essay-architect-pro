/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import { Effect, Match, Ref } from 'effect';
import type { User as UserType } from '../../domain/types';
import { generateSecureToken } from '../../infrastructure/security/crypto-utils';
import { RegisterSessionUseCase } from '../../application/session/RegisterSessionUseCase';
import { ValidateSessionUseCase } from '../../application/session/ValidateSessionUseCase';
import { DeactivateSessionUseCase } from '../../application/session/DeactivateSessionUseCase';
import { supabase } from '../../infrastructure/db/supabase';
import { appRuntime } from '../../infrastructure/runtime';
import type { Notification } from '../../domain/types';

interface UseAuthProps {
  registerSessionUseCase: RegisterSessionUseCase;
  validateSessionUseCase: ValidateSessionUseCase;
  deactivateSessionUseCase: DeactivateSessionUseCase;
  showNotification: (message: string, type: Notification['type']) => void;
}

export const useAuth = ({
  registerSessionUseCase,
  validateSessionUseCase,
  deactivateSessionUseCase,
  showNotification,
}: UseAuthProps) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const verifyAccess = useCallback(
    (user: UserType | null, isSilent: boolean = false) =>
      appRuntime.runPromise(
        Effect.gen(function* () {
          if (!user) {
            setIsPaid(false);
            setActivePlan(null);
            setUserEmail('');
            return;
          }

          // Always set the user's email when they're logged in
          setUserEmail(user.email || '');

          const { data, error } = yield* Effect.tryPromise({
            try: () =>
              supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'approved')
                .order('created_at', { ascending: false })
                .limit(1),
            catch: (err) => new Error(`Payment fetch check error: ${err}`),
          });

          if (error) {
            appRuntime.runSync(Effect.logError('Payment check fetch error', { error }));
            // On network error, keep current state to avoid UI flicker
            return;
          }

          if (data && data.length > 0) {
            const latest = data[0];

            const createdAt = new Date(latest.created_at).getTime();
            const now = Date.now();
            const hoursPassed = (now - createdAt) / (1000 * 60 * 60);

            const planConfig = Match.value(latest.plan_name).pipe(
              Match.when('Consultancy Killer', () => ({
                valid: true,
                msg: 'Welcome back! Your Lifetime access is active.',
                name: 'Lifetime Pack',
              })),
              Match.when('Lifetime Pack', () => ({
                valid: true,
                msg: 'Welcome back! Your Lifetime access is active.',
                name: 'Lifetime Pack',
              })),
              Match.when('Preparation Pack', () => {
                const daysLeft = Math.floor(30 - hoursPassed / 24);
                return daysLeft >= 0
                  ? {
                      valid: true,
                      msg: `Access Unlocked! You have ${daysLeft} days remaining on your Preparation Pack.`,
                      name: 'Preparation Pack',
                    }
                  : {
                      valid: false,
                      msg: 'Your 30-day Preparation Pack has expired.',
                      name: 'Preparation Pack',
                    };
              }),
              Match.when("Crammer's Pass", () => {
                const hoursLeft = Math.floor(24 - hoursPassed);
                return hoursLeft >= 0
                  ? {
                      valid: true,
                      msg: `Access Unlocked! You have ${hoursLeft} hours remaining on your Crammer's Pass.`,
                      name: "Crammer's Pass",
                    }
                  : {
                      valid: false,
                      msg: "Your 24-hour Crammer's Pass has expired.",
                      name: "Crammer's Pass",
                    };
              }),
              Match.orElse(() => ({
                valid: false,
                msg: 'Unknown plan type encountered.',
                name: latest.plan_name,
              })),
            );

            if (planConfig.valid) {
              setIsPaid(true);
              setActivePlan(planConfig.name);
              if (!isSilent) showNotification(planConfig.msg, 'success');
            } else {
              // Plan expired
              setIsPaid(false);
              setActivePlan(null);
              if (!isSilent)
                showNotification(
                  planConfig.msg || 'No active plan found. Your previous plan may have expired.',
                  'info',
                );
            }
          } else {
            // No approved record found - Revoke access
            setIsPaid(false);
            setActivePlan(null);

            if (!isSilent) {
              showNotification(
                'No approved payment found for this email. If you just paid, please wait for manual verification (1-2 hours).',
                'info',
              );
            }
          }
        }).pipe(
          Effect.catchAll((err) =>
            Effect.gen(function* () {
              yield* Effect.logError('Critical verifyAccess error', { error: err });
              const message = err.message;
              if (!isSilent)
                showNotification(`Failed to verify access: ${message}. Please refresh the page.`, 'error');
            }),
          ),
        ),
      ),
    [showNotification],
  );

  // Auth initialization effect
  useEffect(() => {
    const program = Effect.gen(function* () {
      const isLoggingOutRef = yield* Ref.make(false);

      // Handle PKCE recovery token from URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const verificationType = urlParams.get('verification_type');
      const tokenHash = urlParams.get('token_hash');

      if (verificationType === 'recovery' && tokenHash) {
        const { error } = yield* Effect.tryPromise({
          try: () =>
            supabase.auth.verifyOtp({
              type: 'recovery',
              token_hash: tokenHash,
            }),
          catch: (err) => new Error(`Verify OTP failed: ${err}`),
        });

        if (error) {
          appRuntime.runSync(Effect.logError('Recovery token verification failed', { error }));
          showNotification(
            'Failed to verify recovery link. It may have expired. Please request a new one.',
            'error',
          );
        } else {
          // Token verified, will be handled by onAuthStateChange
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      // Initial session check
      const {
        data: { session },
      } = yield* Effect.tryPromise({
        try: () => supabase.auth.getSession(),
        catch: (err) => new Error(`Get session failed: ${err}`),
      });

      if (session) {
        // Validate session against two-device limit
        const { isValid, wasLoggedOut } = yield* validateSessionUseCase.execute(session.user.id);

        if (wasLoggedOut) {
          // Session was invalidated manually or by a rare database event
          yield* Ref.set(isLoggingOutRef, true);
          yield* Effect.tryPromise({
            try: () => supabase.auth.signOut(),
            catch: (err) => new Error(`SignOut failed: ${err}`),
          }).pipe(
            Effect.catchAll((err) => {
              appRuntime.runSync(Effect.logError('SignOut error', { err }));
              return Effect.succeed(void 0);
            }),
          );

          setUser(null);
          setIsPaid(false);
          setUserEmail('');
          setActivePlan(null);
          showNotification('Your session has expired. Please log in again.', 'info');
        } else {
          // If no session record exists, register this session
          if (!isValid) {
            const token = session.access_token?.substring(0, 32);
            const sessionToken = token || (yield* generateSecureToken(16));
            yield* registerSessionUseCase.execute(session.user.id, sessionToken);
          }

          setUser(session.user);
          verifyAccess(session.user, true);
        }
      }

      // Auth Listener with two-device session validation
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        appRuntime.runPromise(
          Effect.gen(function* () {
            // Skip if we're in the middle of a forced logout
            const isLoggingOut = yield* Ref.get(isLoggingOutRef);
            if (isLoggingOut) return;

            if (session) {
              // For SIGNED_IN event, session is already registered by AuthModal
              // For TOKEN_REFRESHED, validate the session
              if (event === 'TOKEN_REFRESHED') {
                const { wasLoggedOut } = yield* validateSessionUseCase.execute(session.user.id);
                if (wasLoggedOut) {
                  yield* Ref.set(isLoggingOutRef, true);
                  yield* Effect.tryPromise({
                    try: () => supabase.auth.signOut(),
                    catch: (err) => new Error(`SignOut failed: ${err}`),
                  }).pipe(
                    Effect.catchAll((err) => {
                      appRuntime.runSync(Effect.logError('SignOut error', { err }));
                      return Effect.succeed(void 0);
                    }),
                  );
                  setUser(null);
                  setIsPaid(false);
                  setUserEmail('');
                  setActivePlan(null);
                  showNotification('Your session has expired. Please log in again.', 'info');
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
          }).pipe(
            Effect.catchAll((err) => {
              appRuntime.runSync(Effect.logError('Auth state change error', { err }));
              return Effect.succeed(void 0);
            }),
          ),
        );
      });

      return subscription;
    }).pipe(
      Effect.catchAll((err) => {
        appRuntime.runSync(Effect.logError('Auth initialization error', { err }));
        return Effect.fail(err);
      }),
    );

    const subscriptionPromise = appRuntime.runPromise(program);

    return () => {
      subscriptionPromise
        .then((sub) => sub?.unsubscribe())
        .catch((err) => appRuntime.runSync(Effect.logError('Unsubscribe error', { err })));
    };
  }, [verifyAccess, validateSessionUseCase, registerSessionUseCase, showNotification]);

  // Periodic session validation - detect when this device was logged out by another device
  useEffect(() => {
    if (!user) return;

    const checkSession = () =>
      appRuntime.runPromise(
        Effect.gen(function* () {
          const { wasLoggedOut } = yield* validateSessionUseCase.execute(user.id);
          if (wasLoggedOut) {
            yield* Effect.tryPromise({
              try: () => supabase.auth.signOut(),
              catch: (err) => new Error(`SignOut error: ${err}`),
            }).pipe(
              Effect.catchAll((err) => {
                appRuntime.runSync(Effect.logError('SignOut error during periodic check', { err }));
                return Effect.succeed(void 0);
              }),
            );
            setUser(null);
            setIsPaid(false);
            setUserEmail('');
            setActivePlan(null);
            showNotification(
              'You have been logged out because you signed in on another device. (Two-device limit)',
              'info',
            );
          }
        }).pipe(Effect.catchAll(() => Effect.succeed(void 0))),
      );

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [user, validateSessionUseCase, showNotification]);

  const handleLogout = useCallback(
    () =>
      appRuntime.runPromise(
        Effect.gen(function* () {
          if (user) {
            yield* Effect.logInfo('Deactivating session for user', { userId: user.id });
            yield* deactivateSessionUseCase.execute(user.id).pipe(
              Effect.tapError((error) => Effect.logWarning('Session deactivation failed', { error })),
              Effect.catchAll(() => Effect.succeed(void 0)),
            );
            yield* Effect.logInfo('Session deactivated successfully', { userId: user.id });
          }

          yield* Effect.tryPromise({
            try: () => supabase.auth.signOut(),
            catch: (err) => new Error(`Logout error: ${err}`),
          });

          // Manual state reset to ensure UI updates immediately
          setUser(null);
          setIsPaid(false);
          setUserEmail('');
          setActivePlan(null);

          // Force a complete page reload to clear all library and browser states
          window.location.href = window.location.origin;
        }),
      ),
    [user, deactivateSessionUseCase],
  );

  return {
    user,
    isPaid,
    userEmail,
    activePlan,
    verifyAccess,
    handleLogout,
  };
};
