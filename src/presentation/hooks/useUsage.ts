/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { useState, useEffect, useCallback } from 'react';
import { Effect } from 'effect';
import { DeviceService } from '../../infrastructure/device/device-id';
import { supabase } from '../../infrastructure/db/supabase';
import { appRuntime } from '../../infrastructure/runtime';

interface UseUsageProps {
  deviceService: DeviceService;
  isPaid: boolean;
}

export const useUsage = ({ deviceService, isPaid }: UseUsageProps) => {
  const [visitorID, setVisitorID] = useState<string | null>(null);
  const [aiUsageCount, setAiUsageCount] = useState<number>(0);
  const [examinerUsageCount, setExaminerUsageCount] = useState<number>(0);

  // Initialize Fingerprint and Sync Usage
  useEffect(() => {
    const initTracking = () =>
      appRuntime.runPromise(
        Effect.gen(function* () {
          const vid = yield* deviceService.getVisitorID();
          setVisitorID(vid);

          // Fetch current usage from Supabase
          const { data, error } = yield* Effect.tryPromise({
            try: () =>
              supabase
                .from('usage_tracking')
                .select('usage_count, examiner_count')
                .eq('visitor_id', vid)
                .maybeSingle(),
            catch: (err) => new Error(`Usage fetch failed: ${err}`),
          });

          if (error) {
            // PGRST116 means no row found, which is handled in the 'else' block
            if (error.code !== 'PGRST116') {
              appRuntime.runSync(
                Effect.logError('Usage fetch failed', { code: error.code, msg: error.message }),
              );
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

            const { error: upsertError } = yield* Effect.tryPromise({
              try: () =>
                supabase.from('usage_tracking').upsert(
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
                ),
              catch: (err) => new Error(`Failed to create initial usage record: ${err}`),
            });

            if (upsertError) {
              appRuntime.runSync(
                Effect.logError('Failed to create initial usage record', {
                  msg: upsertError.message,
                }),
              );
            }
          }
        }).pipe(
          Effect.catchAll((err) => {
            appRuntime.runSync(Effect.logError('initTracking failed', { err }));
            return Effect.succeed(void 0);
          }),
        ),
      );
    initTracking();
  }, [deviceService]);

  const incrementFreeUsage = useCallback(
    () =>
      appRuntime.runPromise(
        Effect.gen(function* () {
          if (!visitorID) return;

          const newCount = aiUsageCount + 1;
          setAiUsageCount(newCount);

          const { error } = yield* Effect.tryPromise({
            try: () =>
              supabase.rpc('increment_usage_count', {
                target_visitor_id: visitorID,
                counter_type: 'ai',
              }),
            catch: (err) => new Error(`Failed to sync AI usage: ${err}`),
          });

          if (error) {
            yield* Effect.logError('RPC Error (AI Usage)', {
              message: error.message,
              details: error.details,
            });
            setAiUsageCount((prev) => prev - 1);
          }
        }).pipe(
          Effect.catchAll((err) =>
            Effect.gen(function* () {
              yield* Effect.logError('AI usage increment failure', { error: err });
              setAiUsageCount((prev) => prev - 1);
            }),
          ),
        ),
      ),
    [visitorID, aiUsageCount],
  );

  const incrementExaminerUsage = useCallback(
    () =>
      appRuntime.runPromise(
        Effect.gen(function* () {
          if (!visitorID || isPaid) return;

          const newCount = examinerUsageCount + 1;
          setExaminerUsageCount(newCount);

          const { error } = yield* Effect.tryPromise({
            try: () =>
              supabase.rpc('increment_usage_count', {
                target_visitor_id: visitorID,
                counter_type: 'examiner',
              }),
            catch: (err) => new Error(`Failed to sync examiner usage: ${err}`),
          });

          if (error) {
            yield* Effect.logError('RPC Error (Examiner Usage)', {
              message: error.message,
              details: error.details,
            });
            setExaminerUsageCount((prev) => prev - 1);
          }
        }).pipe(
          Effect.catchAll((err) =>
            Effect.gen(function* () {
              yield* Effect.logError('Examiner usage increment failure', { error: err });
              setExaminerUsageCount((prev) => prev - 1);
            }),
          ),
        ),
      ),
    [visitorID, examinerUsageCount, isPaid],
  );

  return {
    visitorID,
    aiUsageCount,
    examinerUsageCount,
    incrementFreeUsage,
    incrementExaminerUsage,
  };
};
