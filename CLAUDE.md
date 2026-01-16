# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev              # Start Vite dev server (localhost:5173)
npm run dev:vercel       # Run with Vercel CLI for testing API routes
npm run build            # Production build
npm run lint             # ESLint with zero-warning policy
npm run preview          # Preview production build
```

## Architecture Overview

**Stack**: React 18 + Vite frontend, Supabase (Postgres + Auth), Vercel Edge Functions, Google Gemini 2.5 Flash

### Request Flow

1. **Frontend** (`src/`) - React SPA with step-by-step essay wizard
2. **API Proxy** (`api/ai.js`) - Vercel Edge Function that proxies Gemini requests (keeps API key server-side)
3. **Auth** - Supabase handles JWT auth; anonymous users use Cloudflare Turnstile for bot protection
4. **Database** - Supabase with RLS policies for `payments`, `user_sessions`, `usage_tracking` tables

### Key Source Directories

- `src/components/` - UI components including `StepWizard.jsx` (main essay wizard)
- `src/components/modals/` - Modal components (Auth, Examiner, Refine, Payment, Pricing)
- `src/lib/` - Utilities: `supabase.js` (client), `api.js` (AI calls), `sessionManager.js` (2-device limit), `turnstile.js` (bot protection)
- `api/` - Vercel serverless functions (Gemini proxy with rate limiting)

### Core User Flows

- **Essay Writing**: 4-step wizard (Intro → Body 1 → Body 2 → Conclusion) in `StepWizard.jsx`
- **AI Features**: Autocomplete and Refine via `callProAI()` in `src/lib/api.js`
- **Examiner**: AI grading with IELTS/PTE criteria via `ExaminerModal.jsx`
- **Session Management**: 2-device limit with LRU eviction in `sessionManager.js`
- **Payment**: Manual verification flow - user uploads receipt, admin approves in Supabase

### Environment Variables

**Frontend** (`.env.local`):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` - Supabase connection
- `VITE_DISCORD_WEBHOOK_URL` - Feedback integration
- `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY` - Bot protection

**Server-side** (Vercel Dashboard only):
- `GEMINI_API_KEY` - Never exposed to browser
- `TURNSTILE_SECRET_KEY` - Bot verification
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - For API route validation
