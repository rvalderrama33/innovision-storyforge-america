import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotificationPayload {
  type: 'send_approval_email' | 'send_welcome_email' | 'send_admin_notification';
  data: any;
}

async function sendApprovalEmail(data: any) {
  try {
    console.log('Sending approval email:', data);
    
    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'approval',
        to: data.email,
        name: data.name,
        productName: data.productName,
        slug: data.slug
      }
    });

    if (error) {
      console.error('Error sending approval email:', error);
      throw error;
    }

    console.log('Approval email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send approval email:', error);
    throw error;
  }
}

async function sendWelcomeEmail(data: any) {
  try {
    console.log('Sending welcome email:', data);
    
    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'welcome',
        to: data.email,
        name: data.name
      }
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }

    console.log('Welcome email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

async function sendAdminNotification(data: any) {
  try {
    console.log('Sending admin notification:', data);
    
    const { data: response, error } = await supabase.functions.invoke('send-admin-notifications', {
      body: {
        type: data.type,
        data: data.data
      }
    });

    if (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }

    console.log('Admin notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    throw error;
  }
}

async function setupDatabaseListener() {
  console.log('Setting up database notification listener...');
  
  // Listen for database notifications
  const client = await supabase.client;
  
  // Subscribe to NOTIFY channels
  await supabase.client.rpc('pg_notify', { 
    channel: 'setup_listener', 
    payload: 'Email notification listener started' 
  });

  console.log('Database listener setup complete');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailNotificationPayload = await req.json();
    console.log('Received notification:', payload);

    let result;
    
    switch (payload.type) {
      case 'send_approval_email':
        result = await sendApprovalEmail(payload.data);
        break;
      case 'send_welcome_email':
        result = await sendWelcomeEmail(payload.data);
        break;
      case 'send_admin_notification':
        result = await sendAdminNotification(payload.data);
        break;
      default:
        throw new Error(`Unknown notification type: ${payload.type}`);
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in email notification listener:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Initialize the listener when the function starts
setupDatabaseListener().catch(console.error);

serve(handler);