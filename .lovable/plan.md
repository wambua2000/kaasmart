

## Fix: `getUserByEmail is not a function`

### Problem
The edge function uses `supabaseAdmin.auth.admin.getUserByEmail()` which doesn't exist in the `@supabase/supabase-js@2` version available in the Deno edge runtime. The logs confirm: `supabaseAdmin.auth.admin.getUserByEmail is not a function`.

### Solution
Replace `getUserByEmail` with `listUsers()` filtered by email, which is the supported method in supabase-js v2.

### Change: `supabase/functions/reset-user-password/index.ts`

Replace the user lookup logic (line 37-51) with:

```typescript
// Find user by email using listUsers filter
const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

const existingUser = listData?.users?.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase()
);

if (existingUser) {
  // User exists in auth - update their password
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    existingUser.id,
    { password: newPassword }
  );
  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`);
  }
  userId = existingUser.id;
} else {
  // ... rest of create user logic stays the same
}
```

This is a single-file fix. The rest of the function (profile lookup, invitation marking, request status update) remains unchanged.

