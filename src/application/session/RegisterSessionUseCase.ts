import { Effect } from 'effect';
import { SupabaseClient } from '@supabase/supabase-js';
import { DeviceService } from '../../infrastructure/device/device-id';
import { AppError } from '../../domain/error';

/**
 * Registers a new session for a user, enforcing the two-device limit.
 */
export class RegisterSessionUseCase {
  /**
   * @param {SupabaseClient} supabase - Supabase client
   * @param {DeviceService} deviceService - Device identification service
   */
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly deviceService: DeviceService,
  ) {}

  /**
   * Executes the registration logic.
   * RATIONALE: Centralizing session registration ensures that the two-device limit
   * is always checked before allowing a new session.
   */
  public execute(userId: string, sessionToken: string): Effect.Effect<void, AppError> {
    const program = Effect.gen(this, function* () {
      yield* Effect.logDebug('Starting session registration');

      const visitorId = yield* this.deviceService.getVisitorID();

      // Get existing sessions
      const { data: sessions, error: fetchError } = yield* Effect.tryPromise({
        try: () =>
          this.supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('last_active', { ascending: true }),
        catch: (error) =>
          new AppError({
            message: `Failed to fetch sessions: ${error} `,
            code: 'DATABASE_ERROR',
            shouldLog: true,
          }),
      });

      if (fetchError) {
        return yield* Effect.fail(
          new AppError({
            message: fetchError.message,
            code: 'DATABASE_ERROR',
            shouldLog: true,
          }),
        );
      }

      // Check if session already exists for this device
      const existingSession = sessions?.find((s) => s.visitor_id === visitorId);
      if (existingSession) {
        yield* Effect.logInfo('Updating existing session');
        const { error: updateError } = yield* Effect.tryPromise({
          try: () =>
            this.supabase
              .from('user_sessions')
              .update({
                session_token: sessionToken,
                last_active: new Date().toISOString(),
                is_active: true,
              })
              .eq('id', existingSession.id),
          catch: (error) =>
            new AppError({
              message: `Failed to update session: ${error} `,
              code: 'DATABASE_ERROR',
              shouldLog: true,
            }),
        });

        if (updateError) {
          return yield* Effect.fail(
            new AppError({
              message: updateError.message,
              code: 'DATABASE_ERROR',
              shouldLog: true,
            }),
          );
        }
        return;
      }

      // Enforce 2-device limit by removing oldest session if needed
      if (sessions && sessions.length >= 2) {
        const oldestSession = sessions[0];
        if (oldestSession) {
          yield* Effect.logInfo('Enforcing 2-device limit, removing oldest session', {
            oldestSessionId: oldestSession.id,
          });
          yield* Effect.tryPromise({
            try: () => this.supabase.from('user_sessions').delete().eq('id', oldestSession.id),
            catch: (error) =>
              new AppError({
                message: `Failed to delete oldest session: ${error} `,
                code: 'DATABASE_ERROR',
                shouldLog: true,
              }),
          });
        }
      }

      // Register new session
      yield* Effect.logInfo('Registering new session');
      const { error: insertError } = yield* Effect.tryPromise({
        try: () =>
          this.supabase.from('user_sessions').insert([
            {
              user_id: userId,
              visitor_id: visitorId,
              session_token: sessionToken,
              is_active: true,
            },
          ]),
        catch: (error) =>
          new AppError({
            message: `Failed to insert session: ${error} `,
            code: 'DATABASE_ERROR',
            shouldLog: true,
          }),
      });

      if (insertError) {
        return yield* Effect.fail(
          new AppError({
            message: insertError.message,
            code: 'DATABASE_ERROR',
            shouldLog: true,
          }),
        );
      }
    });

    return program.pipe(Effect.annotateLogs({ userId, operation: 'RegisterSession' }));
  }
}
