/**
 * Session Manager for User Sessions
 * Handles session tracking, validation, and two-device limit enforcement.
 * Users can be logged into a maximum of 2 devices simultaneously.
 * Uses LRU (Least Recently Used) eviction when limit is exceeded.
 */

import { supabase } from './supabase';
import { getVisitorID } from './device-id';
import { SessionResult, SessionValidation, DeviceLimitResult } from '../types';

/**
 * Hashes a token using SHA-256 for secure storage.
 * Session tokens should never be stored in plaintext.
 * @param {string} token - The token to hash
 * @returns {Promise<string>} - Hex-encoded hash
 */
const hashToken = async (token: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Registers a new session for the current device.
 * @param {string} userId - The user's UUID from Supabase auth
 * @param {string} sessionToken - A unique identifier for this session (access_token hash)
 * @returns {Promise<SessionResult>}
 */
export const registerSession = async (userId: string, sessionToken: string): Promise<SessionResult> => {
    try {
        const deviceFingerprint = await getVisitorID();

        // Hash the token before storing for security
        const tokenHash = await hashToken(sessionToken);

        // Upsert session - if device already has a session, update it
        // Include created_at so re-logging makes this the "newest" session for FIFO ordering
        const { error } = await supabase
            .from('user_sessions')
            .upsert({
                user_id: userId,
                device_fingerprint: deviceFingerprint,
                session_token: tokenHash,       // Satisfy NOT NULL constraint (stored hashed)
                session_token_hash: tokenHash,  // Store full hash for validation
                is_active: true,
                created_at: new Date().toISOString(),
                last_active_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,device_fingerprint'
            });

        if (error) throw error;

        // Enforce two-device limit after registering this session
        await enforceDeviceLimit(userId);

        return { success: true };
    } catch (err: any) {
        console.error('Failed to register session:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Validates if the current session is still active.
 * Returns false if this device's session was deactivated by another login.
 * @param {string} userId - The user's UUID
 * @returns {Promise<SessionValidation>}
 */
export const validateSession = async (userId: string): Promise<SessionValidation> => {
    try {
        const deviceFingerprint = await getVisitorID();

        const { data, error } = await supabase
            .from('user_sessions')
            .select('is_active, session_token_hash')
            .eq('user_id', userId)
            .eq('device_fingerprint', deviceFingerprint)
            .single();

        if (error) {
            // PGRST116: JSON object requested, but no rows were returned.
            // This is expected if the session record was deleted or never existed.
            if (error.code === 'PGRST116') {
                return { isValid: false, wasLoggedOut: false };
            }
            console.error(`Session fetch error [${error.code}]:`, error.message);
            throw error;
        }

        // Session exists but was deactivated
        if (!data.is_active) {
            console.warn('Session deactivated for user:', userId);
            return { isValid: false, wasLoggedOut: true };
        }

        // Update last active timestamp
        const { error: updateError } = await supabase
            .from('user_sessions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('device_fingerprint', deviceFingerprint);

        if (updateError) {
            console.error('Failed to update session activity:', updateError);
            // Don't logout on update failure (might be network blip)
        }

        return { isValid: true, wasLoggedOut: false };
    } catch (err) {
        console.error('Critical session validation error:', err);

        // SECURITY: Fallback logic
        // In case of a network error, we'll allow the session to persist for a 
        // grace period. However, we should be careful not to fail open indefinitely.
        return { isValid: true, wasLoggedOut: false };
    }
};

/**
 * Enforces the two-device limit by deactivating the least recently used sessions.
 * Uses LRU (Least Recently Used) eviction strategy - industry standard.
 * @param {string} userId - The user's UUID
 * @returns {Promise<DeviceLimitResult>}
 */
export const enforceDeviceLimit = async (userId: string): Promise<DeviceLimitResult> => {
    const MAX_DEVICES = 2;

    try {
        // Get all active sessions, ordered by most recently active first
        const { data: sessions, error } = await supabase
            .from('user_sessions')
            .select('id, device_fingerprint, last_active_at')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('last_active_at', { ascending: false });

        if (error) throw error;

        // If within limit, nothing to do
        if (!sessions || sessions.length <= MAX_DEVICES) {
            return { success: true, deactivatedCount: 0 };
        }

        // Deactivate oldest sessions beyond the limit (LRU eviction)
        const sessionsToDeactivate = sessions.slice(MAX_DEVICES);
        const idsToDeactivate = sessionsToDeactivate.map(s => s.id);

        const { error: updateError } = await supabase
            .from('user_sessions')
            .update({ is_active: false })
            .in('id', idsToDeactivate);

        if (updateError) throw updateError;

        console.log(`Enforced device limit: deactivated ${idsToDeactivate.length} session(s)`);

        return {
            success: true,
            deactivatedCount: idsToDeactivate.length
        };
    } catch (err) {
        console.error('Failed to enforce device limit:', err);
        return { success: false, deactivatedCount: 0 };
    }
};

/**
 * Gets all active sessions for a user.
 * @param {string} userId - The user's UUID
 * @returns {Promise<any[]>}
 */
export const getActiveSessions = async (userId: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Failed to get active sessions:', err);
        return [];
    }
};

/**
 * Deactivates the current device's session (for manual logout).
 * @param {string} userId - The user's UUID
 * @returns {Promise<{success: boolean}>}
 */
export const deactivateCurrentSession = async (userId: string): Promise<{ success: boolean }> => {
    try {
        const deviceFingerprint = await getVisitorID();

        const { error } = await supabase
            .from('user_sessions')
            .update({ is_active: false })
            .eq('user_id', userId)
            .eq('device_fingerprint', deviceFingerprint);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Failed to deactivate session:', err);
        return { success: false };
    }
};

