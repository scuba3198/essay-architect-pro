/**
 * Vercel Serverless API Route - Gemini AI Proxy
 * 
 * This endpoint securely proxies requests to the Gemini API, keeping the API key
 * server-side only. The key is stored as GEMINI_API_KEY (without VITE_ prefix)
 * in Vercel's environment variables, ensuring it never reaches the browser.
 * 
 * SECURITY:
 * - Logged-in users: Validated via Supabase JWT in Authorization header
 * - Anonymous users: Validated via Cloudflare Turnstile token
 * 
 * @route POST /api/ai
 */

export const config = {
    runtime: 'edge', // Use edge runtime for faster cold starts
};

// Simple in-memory rate limiting (resets on cold start, but good enough for basic protection)
const rateLimitMap = new Map();

/**
 * Verify Supabase JWT token
 * Returns user object if valid, null otherwise
 */
async function verifySupabaseToken(token) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase environment variables not configured');
        return null;
    }

    try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey,
            },
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Supabase token verification failed:', error);
        return null;
    }
}

/**
 * Verify Cloudflare Turnstile token
 * Returns true if valid, false otherwise
 */
async function verifyTurnstileToken(token, clientIP) {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
        console.error('TURNSTILE_SECRET_KEY not configured');
        return false;
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
                remoteip: clientIP,
            }),
        });

        const result = await response.json();
        return result.success === true;
    } catch (error) {
        console.error('Turnstile verification failed:', error);
        return false;
    }
}

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

    // Get client IP for rate limiting and Turnstile verification
    const clientIP = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // --- AUTHENTICATION CHECK ---
    const authHeader = request.headers.get('Authorization');
    const turnstileToken = request.headers.get('X-Turnstile-Token');

    let isAuthenticated = false;

    // Option 1: Check Supabase JWT (for logged-in users)
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwtToken = authHeader.substring(7);
        const user = await verifySupabaseToken(jwtToken);
        if (user) {
            isAuthenticated = true;
        }
    }

    // Option 2: Check Turnstile token (for anonymous users)
    if (!isAuthenticated && turnstileToken) {
        const isTurnstileValid = await verifyTurnstileToken(turnstileToken, clientIP);
        if (isTurnstileValid) {
            isAuthenticated = true;
        }
    }

    // Reject if neither authentication method passed
    if (!isAuthenticated) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized. Please complete verification or log in.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Parse the incoming request
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON payload' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { prompt, systemInstruction, type } = body;

        // Log request details for debugging
        console.log('[API] Request received with type:', type);
        if (type === 'payment') {
            console.log('[API] Payment request detected! Prompt:', prompt);
        }

        // Basic input validation
        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: prompt is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // --- SECURITY: INPUT LENGTH VALIDATION ---
        // Prevent oversized payloads to conserve tokens and prevent DoS-style requests
        const MAX_PROMPT_LENGTH = 8000;
        const MAX_SYSTEM_LENGTH = 2000;

        if (prompt.length > MAX_PROMPT_LENGTH) {
            return new Response(
                JSON.stringify({ error: `Prompt too long. Maximum length is ${MAX_PROMPT_LENGTH} characters.` }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (systemInstruction && systemInstruction.length > MAX_SYSTEM_LENGTH) {
            return new Response(
                JSON.stringify({ error: `System instruction too long. Maximum length is ${MAX_SYSTEM_LENGTH} characters.` }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Basic rate limiting by IP (best effort)
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

        // --- DISCORD NOTIFICATION (If type specified) ---
        // This keeps the webhook secret server-side
        // IMPORTANT: We must await this to prevent Edge Function from terminating before webhook completes
        if (type === 'payment' && prompt) {
            const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
            console.log('[Payment] Type detected, webhook URL exists:', !!webhookUrl);

            if (webhookUrl) {
                // Parse payment details from prompt: "NEW_PAYMENT_SUBMITTED: plan_name (price) by email"
                const match = prompt.match(/NEW_PAYMENT_SUBMITTED:\s*(.+?)\s*\((.+?)\)\s*by\s*(.+)/);
                console.log('[Payment] Prompt match result:', !!match);

                if (match) {
                    const [, planName, price, userEmail] = match;
                    console.log('[Payment] Parsed:', { planName, price, userEmail });

                    const embed = {
                        title: "💳 New Payment Submitted!",
                        color: 0x10B981, // Green
                        fields: [
                            { name: "Plan", value: planName, inline: true },
                            { name: "Amount", value: price, inline: true },
                            { name: "Email", value: userEmail, inline: false },
                        ],
                        footer: { text: "Essay Architect Pro - Payment Verification" },
                        timestamp: new Date().toISOString()
                    };

                    const payload = {
                        content: "🔔 **New payment screenshot uploaded!** Please verify in Supabase.",
                        embeds: [embed]
                    };

                    console.log('[Payment] Sending to Discord...');
                    try {
                        // MUST await - Edge Function terminates as soon as we return, killing pending fetches
                        const response = await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        console.log('[Payment] Discord response status:', response.status);
                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('[Payment] Discord error:', errorText);
                        } else {
                            console.log('[Payment] ✅ Discord notification sent successfully!');
                        }
                    } catch (err) {
                        console.error("[Payment] Discord webhook failed:", err);
                    }
                }
            }
        }

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
