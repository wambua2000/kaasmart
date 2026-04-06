import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { first_name, last_name, email, property_name, phone_number } = await req.json();

    if (!first_name || !last_name || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("Kaa_Samart_Resend");
    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">New Free Account Request</h2>
        <p>A new user has requested a free account on KaaSmart Manager:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; font-weight: bold; color: #374151;">Name</td>
            <td style="padding: 10px; color: #6b7280;">${first_name} ${last_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; font-weight: bold; color: #374151;">Email</td>
            <td style="padding: 10px; color: #6b7280;">${email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px; font-weight: bold; color: #374151;">Property Name</td>
            <td style="padding: 10px; color: #6b7280;">${property_name || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #374151;">Phone Number</td>
            <td style="padding: 10px; color: #6b7280;">${phone_number || "N/A"}</td>
          </tr>
        </table>
        <p style="color: #9ca3af; font-size: 12px;">This email was sent automatically by KaaSmart Manager.</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "KaaSmart <onboarding@resend.dev>",
        to: ["info@kaasmart.app"],
        subject: `New Free Account Request: ${first_name} ${last_name}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(JSON.stringify({ error: "Failed to send email", details: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
