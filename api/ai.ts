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

// Declare global process for Vercel Edge Environment
declare const process: {
  env: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
    GEMINI_API_KEY?: string;
    DISCORD_WEBHOOK_URL?: string;
  };
};

export const config = {
  runtime: 'edge', // Use edge runtime for faster cold starts
};

// ─── Structured Logging ──────────────────────────────────────────────────────
// Edge functions cannot use Effect's runtime. This helper satisfies the
// structured logging rule (machine-readable JSON, timestamp, level, service)
// without any external dependencies.

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const record: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: 'essay-architect-pro/api/ai',
    message,
    ...context,
  };
  if (level === 'ERROR' || level === 'WARN') {
    console.error(JSON.stringify(record));
  } else {
    console.log(JSON.stringify(record));
  }
}

// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitData {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiting (resets on cold start, but good enough for basic protection)
const rateLimitMap = new Map<string, RateLimitData>();

/**
 * Minimal User type for verification
 */
interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Verify Supabase JWT token
 * Returns user object if valid, null otherwise
 */
async function verifySupabaseToken(token: string): Promise<SupabaseUser | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    log('ERROR', 'Supabase environment variables not configured', {
      code: 'MISSING_SUPABASE_CONFIG',
    });
    return null;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    log('ERROR', 'Supabase token verification failed', {
      code: 'SUPABASE_VERIFY_ERROR',
      error: String(error),
    });
    return null;
  }
}

/**
 * Verify Cloudflare Turnstile token
 * Returns true if valid, false otherwise
 */
async function verifyTurnstileToken(token: string, clientIP: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    log('ERROR', 'TURNSTILE_SECRET_KEY not configured', { code: 'MISSING_TURNSTILE_CONFIG' });
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

    const result: { success: boolean } = await response.json();
    return result.success === true;
  } catch (error) {
    log('ERROR', 'Turnstile verification failed', {
      code: 'TURNSTILE_VERIFY_ERROR',
      error: String(error),
    });
    return false;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const correlationId = request.headers.get('X-Correlation-ID') ?? crypto.randomUUID();

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
    log('ERROR', 'GEMINI_API_KEY not configured in Vercel environment', {
      code: 'MISSING_API_KEY',
      correlationId,
    });
    return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get client IP for rate limiting and Turnstile verification
  const clientIP =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // --- AUTHENTICATION CHECK ---
  const authHeader = request.headers.get('Authorization');
  const turnstileToken = request.headers.get('X-Turnstile-Token');

  let isAuthenticated = false;

  // Option 1: Check Supabase JWT (for logged-in users)
  if (authHeader?.startsWith('Bearer ')) {
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
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    // Parse the incoming request
    let body: { prompt: string; systemInstruction?: string; type?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { prompt, systemInstruction, type } = body;

    log('INFO', 'Request received', { correlationId, type });

    // Basic input validation
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'Invalid request: prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- SECURITY: INPUT LENGTH VALIDATION ---
    const MAX_PROMPT_LENGTH = 8000;
    const MAX_SYSTEM_LENGTH = 2000;

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Prompt too long. Maximum length is ${MAX_PROMPT_LENGTH} characters.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (systemInstruction && systemInstruction.length > MAX_SYSTEM_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `System instruction too long. Maximum length is ${MAX_SYSTEM_LENGTH} characters.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
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
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    interface GeminiPayload {
      contents: { role?: string; parts: { text: string }[] }[];
      system_instruction?: { parts: { text: string }[] };
      generationConfig?: {
        thinking_config?: {
          thinking_level?: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
        };
      };
    }

    const payload: GeminiPayload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        thinking_config: {
          thinking_level: 'LOW',
        },
      },
    };

    // Add system instruction if provided
    if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
      payload.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      // Read and discard the raw error body — do NOT forward API details to client
      await geminiResponse.text();
      log('ERROR', 'Gemini API error', {
        code: 'GEMINI_API_ERROR',
        correlationId,
        status: geminiResponse.status,
      });

      return new Response(
        JSON.stringify({
          error: 'AI processing failed. Please try again or check your API key status.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    interface GeminiResponse {
      candidates?: {
        content?: {
          parts?: {
            text?: string;
          }[];
        };
      }[];
    }

    const data = (await geminiResponse.json()) as GeminiResponse;
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    // --- DISCORD NOTIFICATION (If type specified) ---
    if (type === 'payment' && prompt) {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

      if (webhookUrl) {
        let paymentData: { planName: string; price: number; userEmail: string } | null = null;
        try {
          paymentData = JSON.parse(prompt);
        } catch (e) {
          log('ERROR', 'Failed to parse payment JSON payload', {
            code: 'PAYMENT_PARSE_ERROR',
            correlationId,
            error: String(e),
          });
        }

        if (paymentData && paymentData.planName && paymentData.price && paymentData.userEmail) {
          const { planName, price, userEmail } = paymentData;

          const embed = {
            title: '💳 New Payment Submitted!',
            color: 0x10b981,
            fields: [
              { name: 'Plan', value: planName, inline: true },
              { name: 'Amount', value: price, inline: true },
              { name: 'Email', value: userEmail, inline: false },
            ],
            footer: { text: 'Essay Architect Pro - Payment Verification' },
            timestamp: new Date().toISOString(),
          };

          const discordPayload = {
            content: '🔔 **New payment screenshot uploaded!** Please verify in Supabase.',
            embeds: [embed],
          };

          log('INFO', 'Sending payment notification to Discord', { correlationId, planName });
          try {
            // MUST await - Edge Function terminates as soon as we return
            const discordResponse = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(discordPayload),
            });

            if (!discordResponse.ok) {
              const errorText = await discordResponse.text();
              log('ERROR', 'Discord webhook error', {
                code: 'DISCORD_WEBHOOK_ERROR',
                correlationId,
                status: discordResponse.status,
                error: errorText,
              });
            } else {
              log('INFO', 'Discord payment notification sent', { correlationId });
            }
          } catch (err) {
            log('ERROR', 'Discord webhook request failed', {
              code: 'DISCORD_WEBHOOK_FAILED',
              correlationId,
              error: String(err),
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ text: generatedText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log('ERROR', 'AI Proxy unhandled error', {
      code: 'INTERNAL_SERVER_ERROR',
      correlationId,
      error: String(error),
    });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
