import { Effect } from 'effect';
import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../../domain/error';

/**
 * Deactivates all sessions for a user (on logout).
 */
export class DeactivateSessionUseCase {
  /**
   * @param {SupabaseClient} supabase - Supabase client
   */
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Executes the deactivation logic.
   * RATIONALE: Ensures that when a user logs out, their session records
   * are marked as inactive to prevent them from counting against the device limit.
   */
  public execute(userId: string): Effect.Effect<void, AppError> {
    const program = Effect.gen(this, function* () {
      yield* Effect.logInfo('Deactivating all sessions for user');

      const { error } = yield* Effect.tryPromise({
        try: () =>
          this.supabase.from('user_sessions').update({ is_active: false }).eq('user_id', userId),
        catch: (err) =>
          new AppError({
            message: `Deactivation failed: ${err}`,
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
    });

    return program.pipe(Effect.annotateLogs({ userId, operation: 'DeactivateSession' }));
  }
}
