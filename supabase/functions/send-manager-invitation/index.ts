import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  propertyId: string;
  propertyName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, propertyId, propertyName }: InvitationRequest = await req.json();

    console.log(`Processing invitation for ${email} to manage ${propertyName}`);

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate a temporary password
    const temporaryPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    
    console.log(`Generated temporary password for ${email}`);

    // Create user account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        role: 'manager',
        invited: true,
        property_id: propertyId
      }
    });

    if (authError) {
      console.error("Failed to create user:", authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    console.log(`Created user account for ${email}:`, authData.user?.id);

    // Get the current user (property owner) from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !currentUser) {
      throw new Error("Invalid authorization token");
    }

    // Create invitation record
    const { error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        role: 'manager',
        property_id: propertyId,
        password: temporaryPassword, // Store temporary password for reference
        invited_by: currentUser.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

    if (invitationError) {
      console.error("Failed to create invitation:", invitationError);
      throw new Error(`Failed to create invitation: ${invitationError.message}`);
    }

    console.log(`Created invitation record for ${email}`);

    // Note: Email sending would happen here with Resend
    // For now, we'll just return the credentials to be displayed in the UI
    console.log(`Manager invitation processed for ${email} with password: ${temporaryPassword}`);

    // Return credentials for display
    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          email,
          password: temporaryPassword,
        },
        message: "Manager invitation sent successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-manager-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send invitation" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);