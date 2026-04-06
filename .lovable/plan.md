

## Plan: Migrate SMS to Twilio Connector Gateway & Remove Raw API Keys

### Problem
The current `send-sms-notification` edge function uses raw Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`) to call the Twilio API directly. You want to delete those two secrets and use the Twilio connector gateway instead, which handles authentication automatically. `TWILIO_PHONE_NUMBER` stays as the "From" number.

### Approach

**Step 1: Connect the Twilio connector**
Use the Lovable Twilio connector to link your Twilio account. This provides `TWILIO_API_KEY` and `LOVABLE_API_KEY` automatically — no raw credentials needed.

**Step 2: Rewrite `send-sms-notification` edge function**
Replace the direct Twilio API call with the connector gateway pattern:
- Remove references to `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Keep `TWILIO_PHONE_NUMBER` for the "From" number
- Use `https://connector-gateway.lovable.dev/twilio/Messages.json` with `LOVABLE_API_KEY` and `TWILIO_API_KEY` headers
- All other logic (sender/receiver lookup, phone fallback, message formatting) stays the same

**Step 3: Delete the old secrets**
After deployment, you can safely delete `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` from your secrets.

### What stays the same
- In-app messaging (database `messages` table + MessageCenter UI) — works independently, no changes needed
- SMS is sent as a background notification after each in-app message — this behavior is preserved
- All three callers (`MessageCenter.tsx`, `AgentDashboard.tsx`) continue invoking `send-sms-notification` the same way

### File Changes

| File | Change |
|------|--------|
| `supabase/functions/send-sms-notification/index.ts` | Rewrite Twilio call to use connector gateway (`LOVABLE_API_KEY` + `TWILIO_API_KEY`), remove `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` usage |

### Prerequisites
- You'll need to set up the Twilio connector through the connection prompt (I'll trigger this during implementation)

