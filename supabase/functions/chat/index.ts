import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  role: 'owner' | 'manager' | 'tenant';
  userId: string;
  messages: ChatMessage[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, userId, messages } = await req.json() as ChatRequest;
    
    if (!role || !userId || !messages) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: role, userId, messages' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client for fetching user context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch role-specific context
    let contextInfo = '';
    
    try {
      if (role === 'owner') {
        // Fetch owner's properties and stats
        const { data: properties, error: propError } = await supabase
          .from('properties')
          .select('id, name, location, total_rooms, rent_per_room')
          .eq('owner_id', userId);

        if (!propError && properties) {
          const { data: rooms } = await supabase
            .from('rooms')
            .select('id, is_occupied, property_id')
            .in('property_id', properties.map(p => p.id));

          const totalRooms = rooms?.length || 0;
          const occupiedRooms = rooms?.filter(r => r.is_occupied).length || 0;
          const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

          const { data: maintenanceRequests } = await supabase
            .from('messages')
            .select('id, content')
            .eq('receiver_id', userId)
            .ilike('content', '%maintenance%')
            .order('created_at', { ascending: false })
            .limit(5);

          contextInfo = `
USER CONTEXT:
- Total Properties: ${properties.length}
- Total Rooms: ${totalRooms}
- Occupied Rooms: ${occupiedRooms}
- Occupancy Rate: ${occupancyRate}%
- Recent Maintenance Requests: ${maintenanceRequests?.length || 0}
- Properties: ${properties.map(p => p.name).join(', ')}
`;
        }
      } else if (role === 'manager') {
        // Fetch manager's assigned properties
        const { data: managerProps, error: mpError } = await supabase
          .from('manager_properties')
          .select('property_id, can_manage_all')
          .eq('manager_id', userId);

        if (!mpError && managerProps) {
          const canManageAll = managerProps.some(mp => mp.can_manage_all);
          
          let propertyQuery = supabase
            .from('properties')
            .select('id, name, location, total_rooms');
          
          if (!canManageAll) {
            const propertyIds = managerProps.map(mp => mp.property_id).filter(Boolean);
            propertyQuery = propertyQuery.in('id', propertyIds);
          }

          const { data: properties } = await propertyQuery;

          if (properties) {
            const { data: rooms } = await supabase
              .from('rooms')
              .select('id, is_occupied')
              .in('property_id', properties.map(p => p.id));

            const totalRooms = rooms?.length || 0;
            const occupiedRooms = rooms?.filter(r => r.is_occupied).length || 0;

            contextInfo = `
USER CONTEXT:
- Access Level: ${canManageAll ? 'All Properties' : 'Assigned Properties Only'}
- Assigned Properties: ${properties.length}
- Total Rooms Under Management: ${totalRooms}
- Occupied Rooms: ${occupiedRooms}
- Properties: ${properties.map(p => p.name).join(', ')}
`;
          }
        }
      } else if (role === 'tenant') {
        // Fetch tenant's room and property info
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('*, properties(*)')
          .eq('tenant_id', userId)
          .single();

        if (!roomError && room) {
          const { data: maintenanceHistory } = await supabase
            .from('messages')
            .select('id, content, created_at')
            .eq('sender_id', userId)
            .ilike('content', '%maintenance%')
            .order('created_at', { ascending: false })
            .limit(5);

          contextInfo = `
USER CONTEXT:
- Room Number: ${room.room_number}
- Property: ${room.properties?.name || 'N/A'}
- Location: ${room.properties?.location || 'N/A'}
- Rent Amount: $${room.rent_amount}
- Rent Status: ${room.rent_status}
- Accessories: ${room.tenant_accessories?.join(', ') || 'None'}
- Past Maintenance Requests: ${maintenanceHistory?.length || 0}
`;
        }
      }
    } catch (contextError) {
      console.error('Error fetching context:', contextError);
      // Continue without context if there's an error
    }

    // Build role-specific system prompt
    const systemPrompts = {
      owner: `You are a helpful AI assistant for property owners in the KaaSmart Property Management System.

CAPABILITIES YOU CAN HELP WITH:
- Adding new properties (guide to Add Property modal)
- Inviting and managing property managers
- Adding and managing tenants
- Viewing room details and occupancy
- Generating reports (financial, occupancy, maintenance)
- Managing maintenance requests and prioritization
- Viewing and responding to messages
- Managing lease agreements and documents
- Understanding dashboard analytics
- Assisting accountants and co-owners with reporting access

AVAILABLE FEATURES:
- Properties Dashboard: View all properties with occupancy rates
- Room Management: Add/edit rooms, assign tenants
- Messages: Communication with tenants and managers
- Maintenance: Track and respond to maintenance requests
- Reports: Generate CSV reports and document summaries
- Lease Agreements: View and manage all tenant leases

${contextInfo}

Keep responses concise, actionable, and specific to property management tasks.`,

      manager: `You are a helpful AI assistant for property managers in the KaaSmart Property Management System.

CAPABILITIES YOU CAN HELP WITH:
- Viewing assigned properties and rooms
- Managing tenant information (add, edit, view)
- Handling maintenance requests from tenants
- Viewing and responding to messages
- Managing lease agreements
- Tracking property performance metrics
- Understanding compliance and operational tasks
- Assisting maintenance coordinators and assistant managers

AVAILABLE FEATURES:
- Assigned Properties: View properties you manage
- Room Management: View and update tenant information
- Messages: View-only communication between owners and tenants
- Maintenance: View and track maintenance requests
- Lease Agreements: View tenant lease documents

NOTE: Managers have view-only access to messages and cannot send messages directly.

${contextInfo}

Keep responses helpful, focused on operational tasks, and acknowledge access limitations.`,

      tenant: `You are a helpful AI assistant for tenants in the KaaSmart Property Management System.

CAPABILITIES YOU CAN HELP WITH:
- Updating profile information (name, email, phone)
- Submitting maintenance requests (with priority and category)
- Sending messages to property management
- Viewing lease documents and agreement details
- Understanding payment history and rent status
- Uploading lease documents
- Troubleshooting account issues
- Assisting family members and authorized occupants

AVAILABLE FEATURES:
- Profile: Update personal information
- Room Details: View room info, accessories, and rent amount
- Maintenance: Submit new requests and view history
- Messages: Communicate with property owner/manager
- Lease Documents: View and upload lease agreements

${contextInfo}

Keep responses friendly, clear, and focused on tenant needs and rights.`
    };

    const systemPrompt = systemPrompts[role];

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please wait a moment and try again." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to your workspace." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service error" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
