import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TenantCredentialsRequest {
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  roomNumber: string;
  generatedEmail: string;
  temporaryPassword: string;
  loginUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      tenantName, 
      tenantEmail, 
      propertyName, 
      roomNumber, 
      generatedEmail, 
      temporaryPassword, 
      loginUrl 
    }: TenantCredentialsRequest = await req.json();

    console.log("Sending credentials to:", tenantEmail);

    const emailResponse = await resend.emails.send({
      from: "KaaSmart Property Management <onboarding@resend.dev>",
      to: [tenantEmail],
      subject: `Welcome to ${propertyName} - Your Login Credentials`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to KaaSmart</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Property Management System</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e40af; margin-top: 0;">Hello ${tenantName}!</h2>
            <p style="color: #64748b; line-height: 1.6;">
              Welcome to <strong>${propertyName}</strong>! Your room <strong>${roomNumber}</strong> has been assigned and your login credentials are ready.
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">Your Login Credentials</h3>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${generatedEmail}</code></p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code></p>
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 15px 0;">
                <strong>Important:</strong> Please change your password after your first login for security purposes.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h4 style="color: #92400e; margin-top: 0;">Getting Started</h4>
              <ul style="color: #92400e; margin: 10px 0;">
                <li>Use the credentials above to log into your tenant portal</li>
                <li>Update your profile information and change your password</li>
                <li>Upload required documents (lease agreements, ID, etc.)</li>
                <li>Contact your property manager for any questions</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                If you have any questions, please contact our support team.<br>
                <strong>KaaSmart Property Management</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending tenant credentials:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send credentials email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);