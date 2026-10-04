# MatchaNotes Deployment Manual

This guide outlines the complete step-by-step production deployment workflow for **MatchaNotes** on **Vercel** backed by your **Supabase** backend, along with mobile PWA installation.

---

## Prerequisites Checklist

- [x] A Supabase project created (e.g. `gtgewiczfuruusupcfax`) with database schema and storage bucket initialized.
- [x] A GitHub / GitLab / Bitbucket account for hosting the code repository.
- [x] A [Vercel](https://vercel.com) account linked to your git provider.
- [x] Web browser on mobile device (Safari on iOS or Chrome on Android).

---

## Step 1: Git Repository Setup & Push

If you haven't already pushed the codebase to your remote Git repository:

1. **Initialize Git if not already done**:
   ```bash
   git init -b main
   ```
2. **Add all project files and commit**:
   ```bash
   git add .
   git commit -m "feat: complete MatchaNotes application with SPA rewrite and PWA support"
   ```
3. **Create a private repository on GitHub** (e.g. `matcha-notes` or `notes`):
   - Keep the repository **Private** to ensure your personal notes setup and configuration stay private.
4. **Link the remote and push**:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Create Owner User in Supabase Auth

MatchaNotes is designed as a **Single-Tenant Private App** for you alone. The user account must be created manually in Supabase:

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left navigation sidebar, navigate to **Authentication** -> **Users**.
4. Click the green **Add user** button in the top right:
   - Select **Create user** (or **Invite user**).
   - Enter your personal **Email address**.
   - Enter a strong, secure **Password**.
   - Ensure **Auto Confirm User?** is checked (`true`) so you can log in immediately without requiring an email confirmation link.
5. Click **Create user**.

---

## Step 3: Disable Public Signups in Supabase Auth

To guarantee that no unauthorized users can sign up or access your database:

1. In your Supabase Dashboard, navigate to **Authentication** -> **Providers** in the left menu.
2. Under the providers list, click on **Email** to expand its configuration.
3. Locate the setting **"Allow new users to sign up"** (or **"Enable Signups"**).
4. **Uncheck / Disable** this toggle.
5. Click **Save** at the bottom of the Email provider section.

> [!IMPORTANT]
> Disabling new user signups ensures your Supabase Auth service refuses all registration attempts. Only users explicitly provisioned by you in the Dashboard will ever be authenticated.

---

## Step 4: Connecting & Deploying in Vercel Dashboard

MatchaNotes includes a pre-configured `vercel.json` file with single-page application (SPA) rewrite rules to support client-side routing seamlessly.

1. Navigate to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Under **Import Git Repository**, locate your `matcha-notes` repository and click **Import**.
4. Configure Project Settings:
   - **Framework Preset**: Select `Vite` (Vercel will usually auto-detect this).
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build` (or `tsc -b && vite build`).
   - **Output Directory**: `dist`.
   - **Install Command**: `npm install`.
5. Expand the **Environment Variables** section:
   Add the following two environment variables:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_SUPABASE_URL` | `https://<your-project-id>.supabase.co` | Your Supabase Project API URL |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Your Supabase Project Anon Public Key |

   *(Find these in your Supabase Dashboard under **Project Settings** -> **API**).*

6. Click **Deploy**.
7. Vercel will build the project and output your live production URL (e.g., `https://matcha-notes.vercel.app`).
8. Open the production URL in your browser and log in using the email and password you created in Step 2.

---

## Step 5: Mobile Access & PWA Installation

MatchaNotes is fully configured as a Progressive Web App (PWA) with offline styling, responsive touch layouts, viewport fit cover, and custom Matcha app icons.

### On iOS (Apple Safari)
1. Open **Safari** and navigate to your production Vercel URL (e.g. `https://matcha-notes.vercel.app`).
2. Tap the **Share** button (box with an upward arrow) in the bottom navigation toolbar.
3. Scroll down the action sheet and select **"Add to Home Screen"**.
4. Confirm the name **"MatchaNotes"** and tap **Add** in the top right corner.
5. The MatchaNotes icon will now appear on your iPhone/iPad Home Screen. Launching it runs MatchaNotes in full-screen standalone mode without browser URL bars.

### On Android (Google Chrome)
1. Open **Chrome** and navigate to your production Vercel URL.
2. Either tap the **"Install App"** prompt at the bottom of the screen, or tap the **Three Dots (⋮)** menu icon in the upper right.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. Tap **Install** to confirm.
5. MatchaNotes will install as an independent application icon in your launcher and drawer, opening in standalone immersive mode.

---

## Step 6: Post-Deployment Verification Checklist

Verify your production deployment with these quick checks:

- [ ] **Authentication**: Log into your account on both desktop and mobile.
- [ ] **Notes CRUD**: Create a note, format with markdown / lists / code blocks, add tags, and ensure autosave updates in Supabase.
- [ ] **Media Uploads**: Attach an image to a note or banner and verify it loads smoothly from Supabase Storage.
- [ ] **6-Digit PIN Vault**: Set your 6-digit PIN, create encrypted accounts/credentials, test clipboard auto-copy, and verify automatic locking upon 3 minutes of inactivity or tab switching.
- [ ] **Routing & Refresh**: Refresh the page on any sub-route (e.g. `/vault`, `/notes`) and confirm Vercel rewrites to `/index.html` without 404 errors.
