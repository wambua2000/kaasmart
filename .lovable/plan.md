

## Plan: Language Selector + Replace Pricing with Free Account

This plan covers three major changes: (1) a multilingual i18n system with language selectors on both the public site and dashboard, (2) replacing the Pricing page/menu with a "Free Account" signup page, and (3) storing free account signups in the database.

---

### Part 1: Internationalization (i18n) System

**New file: `src/lib/i18n.tsx`**
- Create a React context (`LanguageContext`) with provider and `useLanguage` hook
- Store selected language in `localStorage` and state
- Support 6 languages: English (`en`), Kiswahili (`sw`), Español (`es`), Français (`fr`), Deutsch (`de`), Soomaali (`so`)
- Export a `t(key)` translation function that looks up the current language
- Translation dictionary covering all public page content and dashboard labels/buttons/menus

**New file: `src/lib/translations/en.ts`, `sw.ts`, `es.ts`, `fr.ts`, `de.ts`, `so.ts`**
- Each file exports a flat key-value object with all UI strings
- English is the base; other languages contain translated equivalents
- Keys organized by page/section (e.g., `home.hero.title`, `nav.login`, `dashboard.logout`)

**New component: `src/components/layout/LanguageSelector.tsx`**
- Globe icon (`Globe` from lucide-react) with a dropdown (using existing `DropdownMenu` component)
- Lists all 6 languages with their native names
- On selection, updates the language context which triggers re-render of all translated strings
- Compact design that fits in the navbar

**Modify: `src/components/layout/PublicNavbar.tsx`**
- Add `<LanguageSelector />` before the Login button in the desktop CTA area
- Add it in the mobile menu as well (above the Login/Get Started buttons)

**Modify: `src/pages/Index.tsx` (Dashboard)**
- Add `<LanguageSelector />` next to the Logout button in the top-right corner

**Modify: All public pages and dashboard components**
- Replace hardcoded strings with `t('key')` calls
- This is a large change spanning all 7 public pages, the navbar, footer, login form, and dashboard components

**Wrap app: `src/App.tsx`**
- Wrap the entire app with `<LanguageProvider>`

---

### Part 2: Replace Pricing with Free Account

**Rename navigation item across all files:**
- `PublicNavbar.tsx`: Change `{ name: "Pricing", path: "/pricing" }` → `{ name: t('nav.freeAccount'), path: "/free-account" }`
- `PublicFooter.tsx`: Same change in footer links
- `App.tsx`: Change route from `/pricing` to `/free-account`, import new page component

**Rewrite: `src/pages/PricingPage.tsx` → `src/pages/FreeAccountPage.tsx`** (new file, delete old)
- **Section 1: Hero** — "Start Managing Your Properties for Free" headline with description
- **Section 2: Features** — 6 feature cards (up to 5 properties, tenant management, rent tracking, simple dashboard, one admin user, support access)
- **Section 3: Signup Form** — Card with form fields:
  - First Name, Last Name, Email Address, Property Name, Phone Number
  - Submit button labeled "Request a Free Account"
  - On submit: validate inputs, save to database, show success toast: "Thank you for signing up for KaaSmart Free Account. Our team will contact you shortly."
  - After success, replace form with the thank-you message

---

### Part 3: Database Table for Free Account Signups

**Database migration** — Create `free_account_signups` table:
```sql
CREATE TABLE public.free_account_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  property_name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.free_account_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public signup form)
CREATE POLICY "Allow anonymous inserts" ON public.free_account_signups
  FOR INSERT TO anon WITH CHECK (true);
```

---

### Part 4: Update References

- Remove all references to "Pricing" in `HomePage.tsx` CTAs (if any link to `/pricing`)
- Update any "View Pricing" or "Talk to Sales" buttons to point to `/free-account` or `/support` as appropriate

---

### Files Summary

| File | Action |
|------|--------|
| `src/lib/i18n.tsx` | CREATE — Language context, provider, hook |
| `src/lib/translations/en.ts` | CREATE — English translations |
| `src/lib/translations/sw.ts` | CREATE — Kiswahili translations |
| `src/lib/translations/es.ts` | CREATE — Spanish translations |
| `src/lib/translations/fr.ts` | CREATE — French translations |
| `src/lib/translations/de.ts` | CREATE — German translations |
| `src/lib/translations/so.ts` | CREATE — Somali translations |
| `src/components/layout/LanguageSelector.tsx` | CREATE — Globe dropdown component |
| `src/pages/FreeAccountPage.tsx` | CREATE — Replaces PricingPage |
| `src/pages/PricingPage.tsx` | DELETE |
| `src/components/layout/PublicNavbar.tsx` | MODIFY — Add language selector, rename Pricing to Free Account |
| `src/components/layout/PublicFooter.tsx` | MODIFY — Rename Pricing to Free Account |
| `src/App.tsx` | MODIFY — Wrap with LanguageProvider, update route |
| `src/pages/Index.tsx` | MODIFY — Add language selector to dashboard header |
| `src/pages/HomePage.tsx` | MODIFY — Translate all strings, update CTA links |
| `src/pages/ProductPage.tsx` | MODIFY — Translate all strings |
| `src/pages/HowItWorksPage.tsx` | MODIFY — Translate all strings |
| `src/pages/SecurityPage.tsx` | MODIFY — Translate all strings |
| `src/pages/SupportPage.tsx` | MODIFY — Translate all strings |
| `src/pages/AboutPage.tsx` | MODIFY — Translate all strings |
| `src/components/auth/LoginForm.tsx` | MODIFY — Translate strings |
| Database migration | CREATE — `free_account_signups` table |

