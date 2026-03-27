import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  requestId: string;
  notes?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, newPassword, requestId, notes }: ResetPasswordRequest = await req.json();

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = users.find(u => u.email === email);
    
    if (user) {
      // User exists in auth - update their password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (updateError) {
        throw new Error(`Failed to update password: ${updateError.message}`);
      }
    } else {
      // User doesn't exist in auth yet - create auth account for them
      // Look up their profile to get the correct ID
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role')
        .eq('email', email)
        .maybeSingle();

      if (profile) {
        // Create auth user with the same ID as the profile
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          id: profile.id,
          email: email,
          password: newPassword,
          email_confirm: true,
          user_metadata: { full_name: profile.full_name }
        });

        if (createError) {
          // If user already exists with that ID, try updating instead
          if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              profile.id,
              { password: newPassword }
            );
            if (updateError) {
              throw new Error(`Failed to update password: ${updateError.message}`);
            }
          } else {
            throw new Error(`Failed to create auth user: ${createError.message}`);
          }
        }
      } else {
        // No profile found - create a new auth user
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: newPassword,
          email_confirm: true,
        });

        if (createError) {
          throw new Error(`Failed to create auth user: ${createError.message}`);
        }
      }

      // Mark invitation as used
      await supabaseAdmin
        .from('invitations')
        .update({ is_used: true })
        .eq('email', email)
        .eq('is_used', false);
    }

    // Update password_reset_requests table
    const { error: resetError } = await supabaseAdmin
      .from('password_reset_requests')
      .update({
        status: 'completed',
        new_password: newPassword,
        notes: notes || null,
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (resetError) {
      console.error('Error updating reset request:', resetError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password updated successfully for ${email}` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in reset-user-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
