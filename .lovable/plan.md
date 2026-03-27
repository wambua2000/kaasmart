

## Plan: Fix Password Reset Flow for All Roles

### Problem
1. **Developer dashboard** only shows owner reset requests (filters by `user_role: 'owner'`), but should show owner requests.
2. **Property Owner dashboard** shows ALL pending reset requests (no role filter), but should only show requests from tenants, agents, and managers that they invited.
3. **Edge function** tries to call a `hash_password` RPC that doesn't exist, which will fail for users not yet in auth.
4. After password reset, users need to be able to log in — the edge function already updates auth passwords correctly for existing users, but the `hash_password` fallback for invitation-only users will error.

### Changes

**1. Fix DeveloperDashboard reset count filter** (`src/components/dashboard/DeveloperDashboard.tsx`)
- Keep the existing filter `.eq('user_role', 'owner')` — this is correct since developers handle owner resets.

**2. Fix PropertyOwnerDashboard reset count filter** (`src/components/dashboard/PropertyOwnerDashboard.tsx`)
- Update `fetchPendingResetCount` to filter by non-owner roles: `.in('user_role', ['tenant', 'manager', 'agent'])` so property owners only see requests from their subordinates.
- The realtime subscription toast should also check that the incoming request role is tenant/manager/agent before showing the notification.

**3. Fix PasswordResetRequestsSheet filtering** (`src/components/property/PasswordResetRequestsSheet.tsx`)
- Add a `userRole` prop to indicate whether it's opened from the developer or owner dashboard.
- **Developer context**: Filter requests where `user_role = 'owner'` (no invitation check needed — developers manage all owners).
- **Owner context**: Keep the existing invitation-based filtering (only show requests from users the owner invited), but also filter to `user_role IN ('tenant', 'manager', 'agent')`.

**4. Fix edge function for non-auth users** (`supabase/functions/reset-user-password/index.ts`)
- When the user doesn't exist in auth yet, instead of calling the non-existent `hash_password` RPC, create a new auth user with `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })` and link them to their profile. This ensures they can log in immediately after reset.
- Also update the invitation to mark it as used.

**5. Fix ForgotPasswordDialog routing** (`src/components/auth/ForgotPasswordDialog.tsx`)
- When role is `owner`, the success message should say the request goes to the developer (not property owner).
- When role is `tenant`/`manager`/`agent`, keep the existing message about property owner.

**6. Enable realtime on password_reset_requests** (database migration)
- Add `ALTER PUBLICATION supabase_realtime ADD TABLE public.password_reset_requests;` so the existing realtime subscriptions actually work.

### Files Summary

| File | Action |
|------|--------|
| `src/components/dashboard/PropertyOwnerDashboard.tsx` | MODIFY — Filter reset count to tenant/manager/agent only, filter realtime toast |
| `src/components/property/PasswordResetRequestsSheet.tsx` | MODIFY — Add `userRole` prop, filter by context |
| `src/components/dashboard/DeveloperDashboard.tsx` | MODIFY — Pass `userRole="developer"` to sheet |
| `supabase/functions/reset-user-password/index.ts` | MODIFY — Create auth user instead of calling missing RPC |
| `src/components/auth/ForgotPasswordDialog.tsx` | MODIFY — Role-specific success message |
| Database migration | CREATE — Enable realtime for password_reset_requests |

