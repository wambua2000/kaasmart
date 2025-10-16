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
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    // Update user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
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
      // Don't throw - password was already reset
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
