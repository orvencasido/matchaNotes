# Implementation Phases

## Phase 1: Environment & Database Setup
- **Goal**: Establish the base codebase and link to the existing Supabase instance (`gtgewiczfuruusupcfax`).
- **Deliverables**:
  1. Initialize Web Application (Next.js / Vite React + Tailwind CSS).
  2. Setup Supabase migration scripts for:
     - `notes` table with RLS.
     - `note_attachments` table with RLS.
     - `vault_items` table with RLS.
     - `vault_config` table with RLS.
     - Storage bucket `note-media` with owner-only access policies.
  3. Verify CLI connectivity and apply initial migrations via `npx supabase db push` or migrations.
  4. Build the Single-User Login page (email/password with no register link).

---

## Phase 2: Design System & Responsive Shell
- **Goal**: Implement the non-generic Matcha Green and warm Off-White design tokens with a dual desktop/mobile layout.
- **Deliverables**:
  1. Setup CSS variables and Tailwind theme extension:
     - Matcha dark (`#2D4739`), Matcha accent (`#4E6E58`), Matcha surface (`#E8EFE8`).
     - Off-white canvas (`#FBFBF9`), Off-white elevated card (`#F4F3EE`), Border (`#E4E3DC`).
  2. Implement responsive shell:
     - Desktop: Collapsible navigation rail + note selector + main editor.
     - Mobile: Full viewport height (`dvh`), bottom navigation bar, subtle top action bar.
  3. Establish clean typography and remove all unnecessary labels, instructions, and placeholder junk.

---

## Phase 3: Core Notes & Media Management
- **Goal**: A fluid, customizable notes editor that accommodates freeform text, checklists, and photo attachments.
- **Deliverables**:
  1. Note creation, editing, auto-saving, pinning, and deletion.
  2. Integrated To-Do checklists with direct toggle capabilities.
  3. Image drag-and-drop & file picker connected to Supabase Storage with instant thumbnail previews and lightbox viewing.
  4. Fast keyword filtering and tag selector.

---

## Phase 4: Encrypted 6-Digit PIN Vault (Passwords & Accounts)
- **Goal**: A zero-trust secondary chamber for sensitive credentials, accounts, and passwords.
- **Deliverables**:
  1. Client-side cryptography module (`crypto.subtle` with PBKDF2 and AES-GCM-256).
  2. First-time PIN setup & salt generation stored in `vault_config`.
  3. PIN entry modal / screen with smooth keypad interactions and error shake feedback.
  4. Vault item management (Add account, username, password, sensitive notes, copy-to-clipboard button with visual checkmark).
  5. Idle timeout (auto-locks after 3 minutes or when the app is put in background).

---

## Phase 5: Mobile PWA Polish & Online Deployment
- **Goal**: Make the app installable on mobile devices (iOS/Android) and deploy online.
- **Deliverables**:
  1. Configure Web App Manifest (`manifest.json`) and mobile icons for home screen installation.
  2. Safe-area padding adjustments for iPhone notch and Android navigation bars.
  3. Final review of Supabase RLS security policies.
  4. Deploy to online hosting platform (e.g. Vercel) and connect production Supabase environment variables.
