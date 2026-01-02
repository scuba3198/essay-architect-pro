/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 */

// --- API Helper ---
// Calls the secure server-side proxy instead of Gemini directly
// The API key is stored server-side and never exposed to the browser

export const callProAI = async (prompt, systemInstruction = "") => {
    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, systemInstruction })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

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
