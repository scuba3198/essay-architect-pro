import { Effect } from 'effect';
import { SupabaseClient } from '@supabase/supabase-js';
import { DeviceService } from '../../infrastructure/device/device-id';
import { AppError } from '../../domain/error';

/**
 * Validates a session against the two-device limit.
 */
export class ValidateSessionUseCase {
  /**
   * @param {SupabaseClient} supabase - Supabase client
   * @param {DeviceService} deviceService - Device identification service
   */
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly deviceService: DeviceService,
  ) {}

  /**
   * Executes the validation logic.
   * RATIONALE: Regular validation prevents a single account from being used
   * on more than two devices simultaneously by detecting if the current
   * session has been evicted.
   */
  public execute(
    userId: string,
  ): Effect.Effect<{ isValid: boolean; wasLoggedOut: boolean }, AppError> {
    const program = Effect.gen(this, function* () {
      yield* Effect.logDebug('Starting session validation');

      const visitorId = yield* this.deviceService.getVisitorID();

      const { data: session, error } = yield* Effect.tryPromise({
        try: () =>
          this.supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('visitor_id', visitorId)
            .maybeSingle(),
        catch: (err) =>
          new AppError({
            message: `Session check failed: ${err}`,
            code: 'DATABASE_ERROR',
            shouldLog: true,
          }),
      });

      if (error) {
        return yield* Effect.fail(
          new AppError({
            message: error.message,
            code: 'DATABASE_ERROR',
            shouldLog: true,
          }),
        );
      }

      if (!session || !session.is_active) {
        yield* Effect.logInfo('Session invalidated (LRU eviction or manual logout)');
        return { isValid: false, wasLoggedOut: true };
      }

      // Update last active
      yield* Effect.tryPromise({
        try: () =>
          this.supabase
            .from('user_sessions')
            .update({ last_active: new Date().toISOString() })
            .eq('id', session.id),
        catch: (err) =>
          new AppError({
            message: `Update last active failed: ${err}`,
            code: 'DATABASE_ERROR',
            shouldLog: true,
          }),
      });

      return { isValid: true, wasLoggedOut: false };
    });

    return program.pipe(Effect.annotateLogs({ userId, operation: 'ValidateSession' }));
  }
}
