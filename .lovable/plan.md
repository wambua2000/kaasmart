

## Plan: Favicon, Animations, Footer Email & Free Account Email Notification

### 1. Update Favicon
- Copy `src/assets/kaasmart-logo.png` to `public/favicon.png`
- Update `index.html` to reference `/favicon.png` instead of the external Google Storage URL
- Delete `public/favicon.ico` if it exists

### 2. Add Smooth Scroll Animations to All Public Pages
- Add scroll animation keyframes to `tailwind.config.ts`: `fade-in-up`, `fade-in-left`, `fade-in-right`, `scale-in`
- Create `src/hooks/useScrollAnimation.ts` — a hook using `IntersectionObserver` to trigger animations when sections enter the viewport
- Create `src/components/layout/AnimatedSection.tsx` — a wrapper component that applies the animation
- Wrap each `<section>` in all public pages with `AnimatedSection`: `HomePage`, `AboutPage`, `ProductPage`, `HowItWorksPage`, `SecurityPage`, `SupportPage`, `FreeAccountPage`

### 3. Update Footer Email
- In `PublicFooter.tsx`, change `info@kaasmart.com` → `info@kaasmart.app` and `www.kaasmart.com` → `www.kaasmart.app`

### 4. Send Free Account Signup Details to info@kaasmart.app via Resend
Since the `Kaa_Samart_Resend` secret is already configured, create a new edge function `notify-free-signup` that uses the Resend API to send signup details to `info@kaasmart.app`.

- **New file**: `supabase/functions/notify-free-signup/index.ts`
  - Receives signup data (name, email, property, phone) via POST
  - Calls Resend API directly using the `Kaa_Samart_Resend` secret as the API key
  - Sends a formatted HTML email to `info@kaasmart.app` with the submitted details
  - Sender: `onboarding@resend.dev` (Resend's test domain, works without custom domain verification)

- **Modify**: `src/pages/FreeAccountPage.tsx`
  - After the successful database insert, invoke the `notify-free-signup` edge function
  - Fire-and-forget (don't block the success flow if the email fails)

### Technical Details

| File | Change |
|------|--------|
| `index.html` | Update `<link rel="icon">` to `/favicon.png` |
| `public/favicon.png` | Copy from `src/assets/kaasmart-logo.png` |
| `tailwind.config.ts` | Add animation keyframes |
| `src/hooks/useScrollAnimation.ts` | New — IntersectionObserver hook |
| `src/components/layout/AnimatedSection.tsx` | New — animation wrapper |
| `src/index.css` | Add base animation CSS classes |
| `src/pages/HomePage.tsx` | Wrap sections with AnimatedSection |
| `src/pages/AboutPage.tsx` | Wrap sections with AnimatedSection |
| `src/pages/ProductPage.tsx` | Wrap sections with AnimatedSection |
| `src/pages/HowItWorksPage.tsx` | Wrap sections with AnimatedSection |
| `src/pages/SecurityPage.tsx` | Wrap sections with AnimatedSection |
| `src/pages/SupportPage.tsx` | Wrap sections with AnimatedSection |
| `src/pages/FreeAccountPage.tsx` | Wrap sections + invoke notify edge function |
| `src/components/layout/PublicFooter.tsx` | Update email/website links |
| `supabase/functions/notify-free-signup/index.ts` | New — sends Resend email to info@kaasmart.app |

