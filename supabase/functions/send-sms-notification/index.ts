import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessagePayload {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio configuration');
      return new Response(
        JSON.stringify({ error: 'Twilio configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: MessagePayload = await req.json();

    console.log('Processing message:', payload.message_id);

    // Get sender details
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('full_name, role, phone')
      .eq('id', payload.sender_id)
      .single();

    if (senderError) {
      console.error('Error fetching sender:', senderError);
      throw new Error('Failed to fetch sender details');
    }

    // Get receiver details
    const { data: receiver, error: receiverError } = await supabase
      .from('profiles')
      .select('full_name, role, phone')
      .eq('id', payload.receiver_id)
      .single();

    if (receiverError) {
      console.error('Error fetching receiver:', receiverError);
      throw new Error('Failed to fetch receiver details');
    }

    // Check if receiver has a phone number
    let recipientPhone = receiver.phone;
    
    // If receiver doesn't have phone in profile, check if they're a tenant with phone in rooms table
    if (!recipientPhone) {
      const { data: room } = await supabase
        .from('rooms')
        .select('tenant_phone')
        .eq('tenant_id', payload.receiver_id)
        .single();
      
      recipientPhone = room?.tenant_phone;
    }

    if (!recipientPhone) {
      console.log('Receiver has no phone number, skipping SMS');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Receiver has no phone number registered' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format timestamp
    const timestamp = new Date(payload.created_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Format SMS message
    const senderRole = sender.role === 'owner' ? 'Property Owner' : 
                       sender.role === 'manager' ? 'Property Manager' : 'Tenant';
    const senderName = sender.full_name || 'System';
    
    const smsBody = `${senderRole} (${senderName}): ${payload.content}\n\n[${timestamp}]`;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const authHeader = 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: recipientPhone,
        From: twilioPhoneNumber,
        Body: smsBody,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio API error:', twilioData);
      throw new Error(`Twilio API error: ${twilioData.message || 'Unknown error'}`);
    }

    console.log('SMS sent successfully:', twilioData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_sid: twilioData.sid,
        recipient: recipientPhone 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-sms-notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
