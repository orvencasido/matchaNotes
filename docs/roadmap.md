# Product Roadmap

## Vision
To build an ultra-clean, private, single-user notes application and encrypted vault with a calming Matcha aesthetic, accessible everywhere on web and mobile with zero latency and zero clutter.

---

## Strategic Milestones

### Milestone 1: Secure Infrastructure & Project Skeleton
- [ ] Initialize project with Next.js (App Router) / Vite + React, Tailwind CSS, and Lucide icons.
- [ ] Connect Supabase client and link remote project (`gtgewiczfuruusupcfax`).
- [ ] Configure Supabase Auth for single-tenant mode (disable public signups, create owner account).
- [ ] Implement Route Guards ensuring no unauthenticated access is permitted.

### Milestone 2: Clean Matcha Design System & Core Canvas
- [ ] Implement design tokens (Matcha greens `#2D4739` / `#4E6E58` and warm off-white `#FBFBF9`).
- [ ] Create adaptive layout: desktop sidebar and mobile thumb-friendly bottom bar.
- [ ] Build clean markdown / rich-text note editor with customizable blocks (headers, lists, todos).
- [ ] Integrate Supabase Storage for drag-and-drop picture uploads and media browsing.
- [ ] Implement instant search and tag filtering without unnecessary UI text.

### Milestone 3: Encrypted 6-Digit PIN Vault (Passwords & Accounts)
- [ ] Build the 6-Digit PIN keypad and unlock interface.
- [ ] Implement client-side AES-GCM encryption with PBKDF2 key derivation.
- [ ] Create secure vault UI: account credentials, copy-to-clipboard with timeout clearing, password generator.
- [ ] Implement automatic locking on idle (3 minutes) and tab switch.

### Milestone 4: Mobile Polish & Ergonomic Optimizations
- [ ] Test and refine touch targets (minimum 44x44px), virtual keyboard interactions, and safe-area insets.
- [ ] Configure PWA manifest (Install to Home Screen, app icon, full-screen standalone mode).
- [ ] Add smooth transitions and haptic-style feedback on actions.

### Milestone 5: Production Deployment & Verification
- [ ] Setup production environment variables and verify Supabase RLS security policies.
- [ ] Deploy to Vercel or Cloudflare Pages.
- [ ] End-to-end audit: notes persistence, image uploads, PIN vault security, mobile responsiveness.
