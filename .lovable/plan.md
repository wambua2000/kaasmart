

## Plan: Fix All Missing Database Functions and System-Wide Workflow Issues

### Root Cause
The live database has **zero** public functions. All RPC functions referenced in the codebase (`get_agent_properties_with_stats`, `get_manager_properties_with_stats`, `generate_invitation_credentials`, `generate_rooms_for_property`, `has_role`, `can_manage_property`, `can_manage_property_as_agent`, `hash_password`, `update_updated_at_column`, `handle_invitation_signup`) are completely absent from the database despite being defined in migration files. This is why the Agent dashboard errors out and many other workflows are broken.

### Strategy
Two-pronged approach:
1. **Create a single migration** that recreates all missing database functions
2. **Refactor the Agent and Manager dashboards** to use direct table queries instead of RPC calls (more resilient, simpler)

### Changes

#### 1. Database Migration — Recreate All Missing Functions
A single migration that creates:
- `has_role(uuid, app_role)` — used by dozens of RLS policies
- `update_updated_at_column()` — trigger function for updated_at columns
- `hash_password(text)` — used by invitation system
- `can_manage_property(uuid, uuid)` — manager property access check
- `can_manage_property_as_agent(uuid, uuid)` — agent property access check
- `generate_invitation_credentials(...)` — invitation system
- `handle_invitation_signup()` — auth trigger for new signups
- `generate_rooms_for_property(...)` — room generation when adding properties
- `get_manager_properties_with_stats(uuid)` — manager dashboard data
- `get_agent_properties_with_stats(uuid)` — agent dashboard data

#### 2. Refactor AgentDashboard.tsx — Replace RPC with Direct Queries
Replace `supabase.rpc('get_agent_properties_with_stats')` with direct queries:
- Fetch agent's property assignments from `agent_properties`
- Fetch property details from `properties` with room counts from `rooms`
- Fetch payment totals from `payments`
This makes the agent dashboard work even without the RPC function.

#### 3. Refactor ManagerDashboard.tsx — Replace RPC with Direct Queries
Replace `supabase.rpc('get_manager_properties_with_stats')` with direct queries:
- Fetch manager's property assignments from `manager_properties`
- Fetch property details from `properties` with room counts from `rooms`

#### 4. Refactor AddPropertyModal.tsx — Replace RPC with Direct Insert
Replace `supabase.rpc('generate_rooms_for_property')` with a loop that inserts rooms directly into the `rooms` table.

#### 5. Refactor Invitation Flow — Replace RPC with Direct Operations
In `RoomManagementModal.tsx`, `InvitePropertyOwnerModal.tsx`, and `PropertyOwnerDashboard.tsx`, replace `supabase.rpc('generate_invitation_credentials')` with direct inserts into the `invitations` table + password generation on the client side. The edge function `create-invited-user` already handles user creation separately.

### File Changes Summary

| File | Change |
|------|--------|
| New migration SQL | Create all 10 missing database functions |
| `src/components/dashboard/AgentDashboard.tsx` | Replace RPC with direct queries |
| `src/components/dashboard/ManagerDashboard.tsx` | Replace RPC with direct queries |
| `src/components/property/AddPropertyModal.tsx` | Replace RPC with direct room inserts |
| `src/components/property/RoomManagementModal.tsx` | Replace RPC with direct invitation insert |
| `src/components/property/InvitePropertyOwnerModal.tsx` | Replace RPC with direct invitation insert |
| `src/components/dashboard/PropertyOwnerDashboard.tsx` | Replace RPC with direct invitation inserts for manager/agent invites |

### Why Both Migration AND Refactor?
- The **migration** restores `has_role` and other functions needed by RLS policies — without these, many table queries will fail silently
- The **refactor** makes dashboards resilient by not depending on RPC functions, reducing future breakage risk
- The RPC functions are still created in the migration as a safety net

