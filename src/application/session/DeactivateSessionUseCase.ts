import type { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { Result } from '../../domain/result';

/**
 * Use case for deactivating a user session (logout).
 */
export class DeactivateSessionUseCase {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: Logger,
  ) {}

  /**
   * Deactivates the current session for a specific user.
   *
   * @param userId - The ID of the user whose session should be deactivated.
   * @returns A promise resolving to a Result indicating success or failure.
   */
  async execute(userId: string): Promise<Result<{ success: boolean }>> {
    this.logger.info({ userId }, 'Deactivating session');

    try {
      const { error } = await this.supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        this.logger.error({ userId, error }, 'Failed to deactivate session');
        return { ok: false, error: new Error(error.message) };
      }

      this.logger.info({ userId }, 'Session deactivated successfully');
      return { ok: true, value: { success: true } };
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Unknown error during session deactivation');
      this.logger.error({ userId, error }, 'Unexpected error during session deactivation');
      return { ok: false, error };
    }
  }
}
