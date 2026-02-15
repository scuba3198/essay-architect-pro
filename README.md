# Essay Architect Pro 🏛️✨

**The Architectural Standard for IELTS & PTE Excellence.**

Essay Architect Pro is a professional-grade AI writing suite designed specifically for students aiming for the highest bands (IELTS 8.5+ / PTE 85+). It transforms the chaotic process of essay writing into a precise, architectural discipline.

![Version](https://img.shields.io/badge/version-0.4.0--ts-blue.svg) ![License](https://img.shields.io/badge/license-Proprietary-red.svg) ![Stack](https://img.shields.io/badge/stack-TypeScript%20%7C%20React%20%7C%20Supabase-blue.svg)

## 🚀 Live Production Site
**[https://pro.essay-architect.uk/](https://pro.essay-architect.uk/)**

---

## ✨ Pro Features

-   **🏗️ Structural Blueprinting**: Forces students to follow a rigid, high-scoring structure (Intro, Body Paragraphs, Conclusion) to ensure maximum coherence and cohesion marks.
-   **💎 Centralized AI Intelligence**: No API keys or technical setup required. Access professional Gemini-powered grading and polishing instantly.
-   **📝 The AI Refiner**: Advanced sentence-level polishing. Instantly upgrade vocabulary and grammatical range with one click.
-   **⚖️ The Strict Examiner**: Receive brutal, honest, and accurate feedback based on official IELTS/PTE criteria (Task Response, Coherence, Lexical Resource, Grammatical Range).
-   **⚡ Smart Autocomplete**: Context-aware suggestions that help you maintain flow without writing the essay for you—preserving the learning experience.
-   **📚 Lexical Resource Engine**: Built-in "Vocabulary Pills" providing high-scoring academic connectors and sentence starters curated for each essay section.

## 💳 Subscription Model
The Pro version features a tiered access system managed via a manual-verification payment gateway (eSewa/Khalti):

-   **🔥 Crammer's Pass (24h)**: For the last-minute revision hero. Full access for 24 hours.
-   **⚡ Preparation Pack (30 Days)**: The sweet spot for serious candidates. 30 days of unlimited AI grading.
-   **👑 Lifetime Pack (Lifetime)**: Pay once, own the architect forever. Includes all future feature updates.

## 🛠️ Performance Tech Stack

-   **Frontend**: React 18 + **TypeScript** + Vite (for sub-second HMR and type-safe builds).
-   **Styling**: Custom CSS + Tailwind for a high-contrast, editorial design aesthetic.
-   **Database & Auth**: [Supabase](https://supabase.com/) with hardened RLS policies and real-time session management.
-   **AI Engine**: [Google Gemini 2.5 Flash](https://ai.google.dev/) via a secure **Vercel Edge Proxy (TypeScript)**.
-   **State Management**: Strongly typed React Hooks + `react-helmet-async` for SEO.
-   **Quality Assurance**: Fully typed codebase with zero `tsc` compiler errors.

## 🛸 UX Enhancements

-   **🔒 Auto-Locking Mechanism**: Smart expiration detection that revokes access exactly when a plan expires.
-   **🔄 Smart Redirection**: After payment proof is uploaded, users are automatically directed to a pre-filled "Retrieve Access" screen.
-   **📜 Auto-Scroll UI**: Modals intelligently scroll to relevant sections (like payment retrieval) to minimize friction.
-   **🧭 Interactive Architectural Tour**: Seamless guided onboarding that teaches users the architectural writing workflow.
-   **💬 Discord Feedback Loop**: Direct-to-developer feedback system integrated with Discord for rapid bug reporting and feature requests.

## 🔐 Security & Authentication

-   **🛡️ Secure AI Proxy**: Gemini API keys are stored server-side on Vercel. Requests are proxied via `/api/ai` to prevent exposure.
-   **🤖 Cloudflare Turnstile**: Integrated bot protection for anonymous users to prevent AI endpoint abuse.
-   **📊 Usage Tracking**: Real-time tracking of AI usage for both anonymous and Pro users via Supabase.
-   **🛡️ Hardened RLS**: Row Level Security policies optimized for performance and least-privilege access.
-   **🚦 Rate Limiting**: Server-side rate limiting (30 req/min) to ensure platform stability.
-   **🛡️ Two-Device Session Limit**: Industry-standard session management that limits users to a maximum of 2 concurrent devices. Uses LRU (Least Recently Used) eviction.
-   **🔄 Periodic Session Validation**: Real-time polling detects remote logouts and informs users instantly.
-   **🔑 Password Reset**: Secure email-based password recovery flow.
-   **✅ Confirm Password**: Added password confirmation field during signup to prevent typos.

## 📱 Mobile-First Design

-   **☰ Hamburger Menu**: Collapsible navigation for mobile devices with smooth scrolling support.
-   **🖼️ Responsive Modals**: All modals (Auth, Pricing, About) are optimized for mobile viewports with proper close button visibility.
-   **📐 Dynamic Viewport Handling**: Uses dynamic viewport units to account for mobile browser URL bars.

## 📜 Legal Compliance

-   **Terms of Service**: Comprehensive ToS accessible via footer link.
-   **Privacy Policy**: Detailed privacy policy outlining data handling practices.

## 🏃‍♂️ Manual Installation

1.  **Clone the Architecture**
    ```bash
    git clone https://github.com/scuba3198/essay-architect-pro.git
    ```bash
    cd essay-architect-pro
    ```

2.  **Environment Setup**
    Create a `.env` file for local development:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_DISCORD_WEBHOOK_URL=your_discord_webhook
    VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=your_turnstile_site_key
    ```

    For the AI features to work, ensure the following are set in your Vercel Environment Variables:
    - `GEMINI_API_KEY`
    - `TURNSTILE_SECRET_KEY`
    - `SUPABASE_URL`
    - `SUPABASE_ANON_KEY`

3.  **Launch**
    ```bash
    npm install
    npm run dev
    ```

## 📄 License
Architected for the community. Licensed under [Proprietary License](LICENSE).
   
 