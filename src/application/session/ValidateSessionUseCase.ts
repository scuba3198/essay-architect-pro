import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { DeviceService } from '../../infrastructure/device/device-id';
import { SessionValidation } from '../../domain/types';

/**
 * Use Case for validating an existing user session.
 * RATIONALE: Separating validation from registration avoids monolithic manager objects
 * and allows for more granular error handling and observability.
 */
export class ValidateSessionUseCase {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly deviceService: DeviceService,
    private readonly logger: Logger,
  ) {}

  /**
   * Checks if the current session is valid and active.
   * @param userId - The user ID
   */
  public async execute(userId: string): Promise<SessionValidation> {
    const log = this.logger.child({ userId, operation: 'ValidateSession' });

    try {
      const deviceFingerprint = await this.deviceService.getVisitorID();

      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('is_active, session_token_hash')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { isValid: false, wasLoggedOut: false };
        }
        log.error({ code: error.code, msg: error.message }, 'Session fetch error');
        throw error;
      }

      if (!data.is_active) {
        log.warn('Session deactivated (limit reached or manual logout)');
        return { isValid: false, wasLoggedOut: true };
      }

      // Refresh last active timestamp asynchronously (fire and forget)
      this.supabase
        .from('user_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .then(({ error: updateError }) => {
          if (updateError) {
            log.warn({ err: updateError }, 'Failed to update last_active_at');
          }
        });

      return { isValid: true, wasLoggedOut: false };
    } catch (err: unknown) {
      log.error({ err }, 'Critical session validation error');
      // Fallback: allow session on infrastructure failure to prevent lockout
      return { isValid: true, wasLoggedOut: false };
    }
  }
}
