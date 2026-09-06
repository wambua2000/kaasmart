import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ROLES = ['developer', 'owner', 'manager', 'agent', 'tenant'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email: string = (body.email || '').trim().toLowerCase();
    const password: string = body.password;
    const role: string = body.role;
    const property_id: string | null = body.property_id ?? null;
    const room_id: string | null = body.room_id ?? null;
    const full_name: string | null = body.full_name ?? null;

    console.log('create-invited-user:', { email, role, property_id, room_id });

    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, or role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role: ${role}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Identify the caller (the inviter), if a JWT was provided
    let invitedBy: string | null = body.invited_by ?? null;
    const authHeader = req.headers.get('Authorization');
    if (!invitedBy && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: caller } = await supabaseAdmin.auth.getUser(token);
      invitedBy = caller?.user?.id ?? null;
    }

    // --- 1. Find or create the auth user (paginate; listUsers caps at 50 by default) ---
    let existingUser: { id: string; email?: string } | null = null;
    for (let page = 1; page <= 20; page++) {
      const { data: pageData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (listError) throw listError;
      const match = pageData?.users?.find((u) => u.email?.toLowerCase() === email);
      if (match) {
        existingUser = match;
        break;
      }
      if (!pageData?.users?.length || pageData.users.length < 1000) break;
    }

    let userId: string;

    if (existingUser) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { role, full_name: full_name || email.split('@')[0] },
      });
      if (updateError) throw new Error(`Failed to update user: ${updateError.message}`);
      userId = existingUser.id;
      console.log('Existing auth user updated:', userId);
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, full_name: full_name || email.split('@')[0] },
      });
      if (createError) throw new Error(`Failed to create user: ${createError.message}`);
      if (!newUser?.user) throw new Error('User creation failed - no user returned');
      userId = newUser.user.id;
      console.log('New auth user created:', userId);
    }

    // --- 2. Profile: always upsert so the role is authoritative ---
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          role,
          full_name: full_name || email.split('@')[0],
        },
        { onConflict: 'id' }
      );
    if (profileError) console.error('Profile upsert error:', profileError);

    // --- 3. Roles: exactly one role per invited user ---
    const { error: roleDeleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .neq('role', role);
    if (roleDeleteError) console.error('Role cleanup error:', roleDeleteError);

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
    if (roleError) console.error('Role upsert error:', roleError);

    // --- 4. Role-specific relationships ---
    if (role === 'tenant' && room_id) {
      const { error: roomError } = await supabaseAdmin
        .from('rooms')
        .update({ tenant_id: userId, tenant_email: email, is_occupied: true })
        .eq('id', room_id);
      if (roomError) throw new Error(`Failed to assign tenant to room: ${roomError.message}`);
      console.log('Tenant assigned to room:', room_id);
    }

    if (role === 'manager' || role === 'agent') {
      const table = role === 'manager' ? 'manager_properties' : 'agent_properties';
      const idColumn = role === 'manager' ? 'manager_id' : 'agent_id';

      // The owner whose portfolio this assignment is scoped to
      let ownerId: string | null = null;
      if (property_id) {
        const { data: prop } = await supabaseAdmin
          .from('properties')
          .select('owner_id')
          .eq('id', property_id)
          .maybeSingle();
        ownerId = prop?.owner_id ?? null;
      }
      if (!ownerId && invitedBy) {
        const { data: inviterProfile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', invitedBy)
          .maybeSingle();
        if (inviterProfile?.role === 'owner') ownerId = invitedBy;
      }

      // Remove stale assignments so scope changes take effect
      await supabaseAdmin.from(table).delete().eq(idColumn, userId);

      const { error: linkError } = await supabaseAdmin.from(table).insert({
        [idColumn]: userId,
        property_id: property_id,
        can_manage_all: !property_id,
        owner_id: ownerId,
        assigned_by: invitedBy,
      });
      if (linkError) throw new Error(`Failed to assign ${role} to property: ${linkError.message}`);
      console.log(`${role} assignment created`, { property_id, can_manage_all: !property_id, ownerId });
    }

    // --- 5. Invitation bookkeeping: record it and mark it used ---
    const { data: pendingInvites } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('is_used', false);

    if (pendingInvites && pendingInvites.length > 0) {
      await supabaseAdmin
        .from('invitations')
        .update({ is_used: true, temporary_password: null, role, property_id, room_id })
        .in('id', pendingInvites.map((i) => i.id));
    } else {
      await supabaseAdmin.from('invitations').insert({
        email,
        role,
        property_id,
        room_id,
        invited_by: invitedBy,
        is_used: true,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: existingUser ? 'User account updated successfully' : 'User account created successfully',
        user_id: userId,
        email,
        role,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-invited-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
