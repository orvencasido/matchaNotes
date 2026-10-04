# MatchaNotes (Second Brain & Secure Vault)

## 1. Executive Summary
**MatchaNotes** is a minimalist, personal second-brain web application engineered specifically for a single user to capture thoughts, manage to-dos, store media, and safeguard sensitive accounts and passwords. 

Designed with an aesthetic anchored in ceremonial matcha greens and warm off-white tones, the interface eliminates all visual noise, redundant chrome, and unnecessary boilerplate text.

---

## 2. Core Philosophies
1. **Single-Tenant Sovereignty**:
   - Zero public sign-up or registration pages.
   - Only the designated owner can authenticate.
   - All Row-Level Security (RLS) policies strictly enforce owner-only read/write access.
2. **Layered Defense (Zero-Trust Vault)**:
   - Level 1: Supabase Authentication (Email/Password or Magic Link) for standard notes and to-dos.
   - Level 2: 6-Digit PIN Gate with client-side cryptographic derivation / master key decryption for the Accounts & Passwords Vault.
3. **Intentional Minimalism & Cleanliness**:
   - No gratuitous labels, useless toolbars, or excessive micro-copy.
   - Content-first focus: the note surface is serene, fast, and tactile.
4. **Adaptive Dual-Viewport Ergonomics**:
   - Desktop: expansive sidebar navigation, side-by-side or fluid central canvas, command palette.
   - Mobile: thumb-friendly bottom action navigation, swipe gestures, full-width touch targets.
5. **Modular Fluidity**:
   - Seamlessly blend formatted text, checklists/to-dos, image attachments (via Supabase Storage), and tagged metadata.

---

## 3. Technology Stack Recommendation
- **Frontend Framework**: Next.js (App Router) or Vite + React with Tailwind CSS v4.
- **Backend / Database / Auth**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage, Row Level Security).
- **Design System**: Custom Matcha Palette (`#2E4A3E`, `#4A6B53`, `#88A788`, `#FBFBF8`, `#F3F1EA`) with Tailwind CSS & Radix UI primitives / Lucide minimalist iconography.
- **State Management / Cache**: TanStack Query / Zustand.
- **Rich Editor**: TipTap or Block-based minimalist markdown canvas.
- **Deployment**: Vercel / Netlify / Cloudflare Pages.

---

## 4. Key Modules
- **Notes & Canvas**: Markdown/rich-text notes with drag-and-drop image uploads, tag chips, and instant full-text search.
- **Tasks & To-Dos**: Clean interactive checklists with status toggles and due-date pins.
- **Secure Vault (Accounts & Passwords)**:
  - Protected behind an interactive 6-digit numeric keypad/PIN prompt.
  - Auto-locks upon tab switch or 2-minute inactivity.
  - One-click copy for credentials with auto-clearing clipboard buffer.
