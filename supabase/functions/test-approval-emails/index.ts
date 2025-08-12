import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

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
    console.log('Testing approval emails...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const testEmail = 'ricardo@myproduct.today';
    
    // Send story approval email
    console.log('Sending story approval email...');
    const storyEmailResponse = await supabase.functions.invoke('send-email', {
      body: {
        type: 'story_approved',
        to: testEmail,
        submissionData: {
          full_name: 'John Test Innovator',
          product_name: 'EcoSmart Water Bottle',
          slug: 'ecosmart-water-bottle-test',
          email: testEmail
        }
      }
    });

    console.log('Story email response:', storyEmailResponse);

    // Send vendor approval email
    console.log('Sending vendor approval email...');
    const vendorEmailResponse = await supabase.functions.invoke('send-email', {
      body: {
        type: 'vendor_approved',
        to: testEmail,
        vendorData: {
          business_name: 'TechGear Innovations',
          contact_email: testEmail
        }
      }
    });

    console.log('Vendor email response:', vendorEmailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test emails sent successfully',
        storyEmail: storyEmailResponse,
        vendorEmail: vendorEmailResponse
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('Error sending test emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});