import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { DeviceService } from '../../infrastructure/device/device-id';
import { SessionResult } from '../../domain/types';

/**
 * Hash a token using SHA-256 for secure storage.
 * @param token - The token to hash
 * @returns {Promise<string>} - Hex-encoded hash
 */
const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Use Case for registering a new user session.
 * RATIONALE: Single-purpose class following the Command pattern for session orchestration.
 * Enforces a two-device limit using LRU eviction.
 */
export class RegisterSessionUseCase {
  private readonly MAX_DEVICES = 2;

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly deviceService: DeviceService,
    private readonly logger: Logger,
  ) {}

  /**
   * Registers a session for a user and device.
   * @param userId - The user ID
   * @param sessionToken - The raw session token to hash and store
   */
  public async execute(userId: string, sessionToken: string): Promise<SessionResult> {
    const log = this.logger.child({ userId, operation: 'RegisterSession' });

    try {
      const deviceFingerprint = await this.deviceService.getVisitorID();
      const tokenHash = await hashToken(sessionToken);

      log.debug({ deviceFingerprint }, 'Upserting session record');

      const { error } = await this.supabase.from('user_sessions').upsert(
        {
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          session_token: tokenHash,
          session_token_hash: tokenHash,
          is_active: true,
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,device_fingerprint',
        },
      );

      if (error) throw error;

      await this.enforceDeviceLimit(userId, log);

      return { success: true };
    } catch (err: unknown) {
      log.error({ err }, 'Failed to register session');
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Enforces the two-device limit by deactivating the least recently used sessions.
   * @private
   */
  private async enforceDeviceLimit(userId: string, log: Logger): Promise<void> {
    const { data: sessions, error } = await this.supabase
      .from('user_sessions')
      .select('id, device_fingerprint, last_active_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_active_at', { ascending: false });

    if (error) throw error;

    if (!sessions || sessions.length <= this.MAX_DEVICES) {
      return;
    }

    const sessionsToDeactivate = sessions.slice(this.MAX_DEVICES);
    const idsToDeactivate = sessionsToDeactivate.map((s) => s.id);

    const { error: updateError } = await this.supabase
      .from('user_sessions')
      .update({ is_active: false })
      .in('id', idsToDeactivate);

    if (updateError) throw updateError;

    log.info({ deactivatedCount: idsToDeactivate.length }, 'Enforced device limit (LRU eviction)');
  }
}
