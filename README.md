# Essay Architect Pro 🏛️✨

**The Architectural Standard for IELTS & PTE Excellence.**

Essay Architect Pro is a professional-grade AI writing suite designed specifically for students aiming for the highest bands (IELTS 8.5+ / PTE 85+). It transforms the chaotic process of essay writing into a precise, architectural discipline.

![Version](https://img.shields.io/badge/version-0.3.0--pro-gold.svg) ![License](https://img.shields.io/badge/license-Proprietary-red.svg) ![Stack](https://img.shields.io/badge/stack-React%20%7C%20Supabase%20%7C%20Gemini-blue.svg)

## 🚀 Live Production Site
**[https://pro.essay-architect.uk/](https://pro.essay-architect.uk/)**

---

## ✨ Pro Features

-   **🏗️ Structural Blueprinting**: Forces students to follow a rigid, high-scoring structure (Intro, Body Paragraphs, Conclusion) to ensure maximum coherence and cohesion marks.
-   **💎 Centralized AI Intelligence**: No API keys or technical setup required. Access professional Gemini-powered grading and polishing instantly.
-   **📝 The AI Refiner**: Advanced sentence-level polishing. Instantly upgrade vocabulary and grammatical range with one click.
-   **⚖️ The Strict Examiner**: Receive brutal, honest, and accurate feedback based on official IELTS/PTE criteria (Task Response, Coherence, Lexical Resource, Grammatical Range).
-   **⚡ Smart Autocomplete**: Context-aware suggestions that help you maintain flow without writing the essay for you—preserving the learning experience.

## 💳 Subscription Model
The Pro version features a tiered access system managed via a manual-verification payment gateway (eSewa/Khalti):

-   **🔥 Crammer's Pass (24h)**: For the last-minute revision hero. Full access for 24 hours.
-   **⚡ Preparation Pack (30 Days)**: The sweet spot for serious candidates. 30 days of unlimited AI grading.
-   **👑 Consultancy Killer (Lifetime)**: Pay once, own the architect forever. Includes all future feature updates.

## 🛠️ Performance Tech Stack

-   **Frontend**: React 18 + Vite (for sub-second HMR and optimized builds).
-   **Styling**: Custom CSS + Tailwind for a high-contrast, editorial design aesthetic.
-   **Database & Auth**: [Supabase](https://supabase.com/) for secure payment tracking and real-time access verification.
-   **AI Engine**: [Google Gemini 2.5 Flash](https://ai.google.dev/) via centralized secure integration.
-   **State Management**: Optimized React Hooks for persistent session management.

## 🛸 UX Enhancements

-   **🔒 Auto-Locking Mechanism**: Smart expiration detection that revokes access exactly when a plan expires.
-   **🔄 Smart Redirection**: After payment proof is uploaded, users are automatically directed to a pre-filled "Retrieve Access" screen.
-   **📜 Auto-Scroll UI**: Modals intelligently scroll to relevant sections (like payment retrieval) to minimize friction.

## 🏃‍♂️ Manual Installation

1.  **Clone the Architecture**
    ```bash
    git clone https://github.com/scuba3198/essay-architect-pro.git
    cd essay-architect-pro
    ```

2.  **Environment Setup**
    Create a `.env` file:
    ```env
    VITE_SUPABASE_URL=your_url
    VITE_SUPABASE_ANON_KEY=your_key
    VITE_GEMINI_API_KEY=your_key
    VITE_DISCORD_WEBHOOK_URL=your_webhook
    ```

3.  **Launch**
    ```bash
    npm install
    npm run dev
    ```

## 📄 License
Architected for the community. Licensed under [Proprietary License](LICENSE).
