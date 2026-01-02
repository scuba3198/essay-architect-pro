/**
 * Session Manager for User Sessions
 * Handles session tracking, validation, and two-device limit enforcement.
 * Users can be logged into a maximum of 2 devices simultaneously.
 * Uses LRU (Least Recently Used) eviction when limit is exceeded.
 */

import { supabase } from './supabase';
import { getVisitorID } from './device-id';

/**
 * Registers a new session for the current device.
 * @param {string} userId - The user's UUID from Supabase auth
 * @param {string} sessionToken - A unique identifier for this session (access_token hash)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const registerSession = async (userId, sessionToken) => {
    try {
        const deviceFingerprint = await getVisitorID();

        // Upsert session - if device already has a session, update it
        // Include created_at so re-logging makes this the "newest" session for FIFO ordering
        const { error } = await supabase
            .from('user_sessions')
            .upsert({
                user_id: userId,
                device_fingerprint: deviceFingerprint,
                session_token: sessionToken,
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
    } catch (err) {
        console.error('Failed to register session:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Validates if the current session is still active.
 * Returns false if this device's session was deactivated by another login.
 * @param {string} userId - The user's UUID
 * @returns {Promise<{isValid: boolean, wasLoggedOut: boolean}>}
 */
export const validateSession = async (userId) => {
    try {
        const deviceFingerprint = await getVisitorID();

        const { data, error } = await supabase
            .from('user_sessions')
            .select('is_active, session_token')
            .eq('user_id', userId)
            .eq('device_fingerprint', deviceFingerprint)
            .single();

        if (error) {
            // No session found - could be first time or was deleted
            if (error.code === 'PGRST116') {
                return { isValid: false, wasLoggedOut: false };
            }
            throw error;
        }

        // Session exists but was deactivated (e.g. manual logout from another device if implemented later)
        if (!data.is_active) {
            return { isValid: false, wasLoggedOut: true };
        }

        // Update last active timestamp
        await supabase
            .from('user_sessions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('device_fingerprint', deviceFingerprint);

        return { isValid: true, wasLoggedOut: false };
    } catch (err) {
        console.error('Failed to validate session:', err);
        // On error, assume valid to avoid false logouts
        return { isValid: true, wasLoggedOut: false };
    }
};

/**
 * Enforces the two-device limit by deactivating the least recently used sessions.
 * Uses LRU (Least Recently Used) eviction strategy - industry standard.
 * @param {string} userId - The user's UUID
 * @returns {Promise<{success: boolean, deactivatedCount: number}>}
 */
export const enforceDeviceLimit = async (userId) => {
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
 * @returns {Promise<Array>}
 */
export const getActiveSessions = async (userId) => {
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
export const deactivateCurrentSession = async (userId) => {
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
