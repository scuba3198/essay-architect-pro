/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 */

import { supabase } from './supabase';
import { getTurnstileToken, loadTurnstileScript } from './turnstile';

// --- API Helper ---
// Calls the secure server-side proxy instead of Gemini directly
// The API key is stored server-side and never exposed to the browser

/**
 * Call the AI API with proper authentication
 * - Logged-in users: Uses Supabase JWT
 * - Anonymous users: Uses Cloudflare Turnstile verification
 */
export const callProAI = async (prompt, systemInstruction = "", type = "completion") => {
    try {
        const headers = { 'Content-Type': 'application/json' };

        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            // Logged-in user: send JWT
            headers['Authorization'] = `Bearer ${session.access_token}`;
        } else {
            // Anonymous user: get Turnstile token
            try {
                const turnstileToken = await getTurnstileToken();
                headers['X-Turnstile-Token'] = turnstileToken;
            } catch (turnstileError) {
                console.error('Turnstile verification failed:', turnstileError);
                throw new Error('Human verification failed. Please refresh the page and try again.');
            }
        }

        const response = await fetch('/api/ai', {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt, systemInstruction, type })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 401) {
                throw new Error("Verification required. Please refresh the page or log in.");
            }
            if (response.status === 429) {
                throw new Error("Too many requests. Please wait a moment before trying again.");
            }
            if (response.status === 503) {
                throw new Error("Pro AI services are currently undergoing maintenance. Please contact support.");
            }
            throw new Error(errorData.error || `AI Engine Error: ${response.status}`);
        }

        const data = await response.json();
        return data.text || null;
    } catch (error) {
        console.error("Pro AI Engine failure:", error);
        throw error;
    }
};

