/**
 * Vercel Serverless API Route - Gemini AI Proxy
 * 
 * This endpoint securely proxies requests to the Gemini API, keeping the API key
 * server-side only. The key is stored as GEMINI_API_KEY (without VITE_ prefix)
 * in Vercel's environment variables, ensuring it never reaches the browser.
 * 
 * @route POST /api/ai
 */

export const config = {
    runtime: 'edge', // Use edge runtime for faster cold starts
};

// Simple in-memory rate limiting (resets on cold start, but good enough for basic protection)
const rateLimitMap = new Map();

export default async function handler(request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Get API key from server-side environment (NOT exposed to browser)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('GEMINI_API_KEY not configured in Vercel environment');
        return new Response(
            JSON.stringify({ error: 'AI service temporarily unavailable' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Parse the incoming request
        const { prompt, systemInstruction } = await request.json();

        if (!prompt || typeof prompt !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Invalid request: prompt is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Basic rate limiting by IP (best effort)
        const clientIP = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        const now = Date.now();
        const windowMs = 60000; // 1 minute window
        const maxRequests = 30; // 30 requests per minute per IP

        const clientData = rateLimitMap.get(clientIP) || { count: 0, resetTime: now + windowMs };

        if (now > clientData.resetTime) {
            clientData.count = 0;
            clientData.resetTime = now + windowMs;
        }

        clientData.count++;
        rateLimitMap.set(clientIP, clientData);

        if (clientData.count > maxRequests) {
            return new Response(
                JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
        };

        // Add system instruction if provided
        if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
            payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errorText);

            // Return a user-friendly error without exposing API details
            return new Response(
                JSON.stringify({ error: 'AI processing failed. Please try again.' }),
                { status: 502, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const data = await geminiResponse.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

        return new Response(
            JSON.stringify({ text: generatedText }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('AI Proxy error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
