import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, role, property_id, room_id } = await req.json();

    console.log('Creating invited user:', { email, role, property_id, room_id });

    // Validate input
    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, or role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    if (existingUser) {
      console.log('User already exists, updating password and assignment:', email);
      
      // Update their password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError) {
        console.error('Error updating user password:', updateError);
        throw updateError;
      }

      // If tenant, assign to room
      if (role === 'tenant' && room_id) {
        const { error: roomError } = await supabaseAdmin
          .from('rooms')
          .update({
            tenant_id: existingUser.id,
            is_occupied: true
          })
          .eq('id', room_id);

        if (roomError) {
          console.error('Error assigning tenant to room:', roomError);
          throw roomError;
        }
      }

      // Mark invitation as used
      const { error: inviteError } = await supabaseAdmin
        .from('invitations')
        .update({ is_used: true, temporary_password: null })
        .eq('email', email)
        .eq('is_used', false);

      if (inviteError) {
        console.log('Warning: Could not mark invitation as used:', inviteError);
      }

      console.log('User updated successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User account updated successfully',
          user_id: existingUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new user with admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role,
        full_name: email.split('@')[0], // Default name from email
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('User created successfully:', newUser.user.id);

    // The handle_invitation_signup trigger will automatically:
    // 1. Create profile
    // 2. Set role
    // 3. Assign to room (for tenants)
    // 4. Create manager-property relationship (for managers)
    // 5. Mark invitation as used

    // However, we need to manually trigger the profile creation and role assignment
    // since the trigger only runs on signup, not admin creation

    // Insert profile manually
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        role,
        full_name: email.split('@')[0]
      });

    if (profileError && !profileError.message.includes('duplicate key')) {
      console.error('Error creating profile:', profileError);
    }

    // Insert role manually
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role
      });

    if (roleError && !roleError.message.includes('duplicate key')) {
      console.error('Error creating user role:', roleError);
    }

    // If tenant, assign to room
    if (role === 'tenant' && room_id) {
      const { error: roomError } = await supabaseAdmin
        .from('rooms')
        .update({
          tenant_id: newUser.user.id,
          is_occupied: true
        })
        .eq('id', room_id);

      if (roomError) {
        console.error('Error assigning tenant to room:', roomError);
        throw roomError;
      }
      console.log('Tenant assigned to room:', room_id);
    }

    // If manager, create manager-property relationship
    if (role === 'manager') {
      // Get the user who created this invitation (the property owner)
      const { data: invitation } = await supabaseAdmin
        .from('invitations')
        .select('invited_by')
        .eq('email', email)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (property_id) {
        // Single property assignment
        const { error: managerError } = await supabaseAdmin
          .from('manager_properties')
          .insert({
            manager_id: newUser.user.id,
            property_id,
            assigned_by: invitation?.invited_by
          });

        if (managerError && !managerError.message.includes('duplicate key')) {
          console.error('Error creating manager-property relationship:', managerError);
          throw managerError;
        }
        console.log('Manager assigned to property:', property_id);
      } else {
        // All properties access
        const { error: managerError } = await supabaseAdmin
          .from('manager_properties')
          .insert({
            manager_id: newUser.user.id,
            property_id: null,
            can_manage_all: true,
            assigned_by: invitation?.invited_by
          });

        if (managerError && !managerError.message.includes('duplicate key')) {
          console.error('Error creating manager all-properties access:', managerError);
          throw managerError;
        }
        console.log('Manager granted access to all properties');
      }
    }

    // If agent, create agent-property relationship
    if (role === 'agent') {
      const { data: invitation } = await supabaseAdmin
        .from('invitations')
        .select('invited_by')
        .eq('email', email)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (property_id) {
        // Single property assignment
        const { error: agentError } = await supabaseAdmin
          .from('agent_properties')
          .insert({
            agent_id: newUser.user.id,
            property_id,
            assigned_by: invitation?.invited_by
          });

        if (agentError && !agentError.message.includes('duplicate key')) {
          console.error('Error creating agent-property relationship:', agentError);
          throw agentError;
        }
        console.log('Agent assigned to property:', property_id);
      } else {
        // All properties access
        const { error: agentError } = await supabaseAdmin
          .from('agent_properties')
          .insert({
            agent_id: newUser.user.id,
            property_id: null,
            can_manage_all: true,
            assigned_by: invitation?.invited_by
          });

        if (agentError && !agentError.message.includes('duplicate key')) {
          console.error('Error creating agent all-properties access:', agentError);
          throw agentError;
        }
        console.log('Agent granted access to all properties');
      }
    }

    // Mark invitation as used
    const { error: inviteError } = await supabaseAdmin
      .from('invitations')
      .update({ is_used: true, temporary_password: null })
      .eq('email', email)
      .eq('is_used', false);

    if (inviteError) {
      console.log('Warning: Could not mark invitation as used:', inviteError);
    }

    console.log('Invitation marked as used');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User account created successfully',
        user_id: newUser.user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-invited-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
