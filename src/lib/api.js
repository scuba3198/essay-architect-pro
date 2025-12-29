/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 */

// --- API Helper ---
export const callProAI = async (prompt, systemInstruction = "") => {
    // Retrieve key from Environment Variable for centralized usage
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!apiKey) {
        throw new Error("Pro AI services are currently undergoing maintenance. Please contact support.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 400 || response.status === 403) {
                throw new Error("Premium AI connection interrupted. Please try again.");
            }
            throw new Error(`AI Engine Error: ${response.status}`);
        }
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error("Pro AI Engine failure:", error);
        throw error;
    }
};
