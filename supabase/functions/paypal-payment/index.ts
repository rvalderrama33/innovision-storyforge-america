
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayPalOrderRequest {
  submissionId: string;
  amount: number;
  currency: string;
}

interface PayPalCaptureRequest {
  orderID: string;
  submissionId: string;
}

serve(async (req) => {
  console.log('PayPal payment function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const { action, ...data } = requestBody;
    console.log('Action:', action, 'Data:', data);

    if (action === 'create-order') {
      const { submissionId, amount, currency } = data as PayPalOrderRequest;
      
      console.log('Creating order for submission:', submissionId);
      
      if (!submissionId) {
        console.error('Missing submissionId');
        return new Response(
          JSON.stringify({ error: 'Missing submission ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verify submission exists and is approved
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('id, product_name, email, full_name, status, featured')
        .eq('id', submissionId)
        .single();

      console.log('Submission query result:', { submission, submissionError });

      if (submissionError) {
        console.error('Submission error:', submissionError);
        return new Response(
          JSON.stringify({ error: `Submission not found: ${submissionError.message}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!submission) {
        console.error('No submission found for ID:', submissionId);
        return new Response(
          JSON.stringify({ error: 'Submission not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (submission.status !== 'approved') {
        console.error('Submission not approved, status:', submission.status);
        return new Response(
          JSON.stringify({ error: 'Submission must be approved before featuring' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (submission.featured) {
        console.error('Submission already featured');
        return new Response(
          JSON.stringify({ error: 'Story is already featured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already has pending or completed payment
      const { data: existingPayment } = await supabase
        .from('featured_story_payments')
        .select('status')
        .eq('submission_id', submissionId)
        .in('status', ['pending', 'completed'])
        .single();

      if (existingPayment) {
        console.error('Existing payment found:', existingPayment);
        return new Response(
          JSON.stringify({ error: 'Story already has a featured payment' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create PayPal order
      console.log('Creating PayPal order...');
      const paypalResponse = await fetch(`${getPayPalBaseURL()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getPayPalAccessToken()}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency,
              value: (amount / 100).toFixed(2)
            },
            description: `Featured Story Upgrade - ${submission.product_name}`,
            reference_id: submissionId
          }],
          application_context: {
            return_url: `https://americainnovates.us/payment/success`,
            cancel_url: `https://americainnovates.us/payment/cancel`,
            brand_name: 'America Innovates Magazine',
            user_action: 'PAY_NOW'
          }
        })
      });

      const order = await paypalResponse.json();
      console.log('PayPal order response:', order);

      if (!paypalResponse.ok) {
        console.error('PayPal order creation failed:', order);
        return new Response(
          JSON.stringify({ error: 'Failed to create PayPal order', details: order }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store payment record
      const { error: insertError } = await supabase
        .from('featured_story_payments')
        .insert({
          submission_id: submissionId,
          paypal_order_id: order.id,
          amount: amount,
          currency: currency,
          status: 'pending',
          payer_email: submission.email,
          payer_name: submission.full_name
        });

      if (insertError) {
        console.error('Failed to store payment record:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store payment record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Order created successfully:', order.id);
      return new Response(
        JSON.stringify({ orderID: order.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'capture-order') {
      const { orderID, submissionId } = data as PayPalCaptureRequest;

      console.log('Capturing order:', orderID, 'for submission:', submissionId);

      // Capture the PayPal payment
      const paypalResponse = await fetch(`${getPayPalBaseURL()}/v2/checkout/orders/${orderID}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getPayPalAccessToken()}`,
        }
      });

      const capture = await paypalResponse.json();
      console.log('PayPal capture response:', capture);

      if (!paypalResponse.ok) {
        console.error('PayPal capture failed:', capture);
        return new Response(
          JSON.stringify({ error: 'Failed to capture payment', details: capture }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update payment status and set featured dates
      const featuredStartDate = new Date().toISOString();
      const featuredEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      const { error: updateError } = await supabase
        .from('featured_story_payments')
        .update({
          status: 'completed',
          paypal_payment_id: capture.id,
          payer_email: capture.payer?.email_address,
          payer_name: `${capture.payer?.name?.given_name || ''} ${capture.payer?.name?.surname || ''}`.trim(),
          featured_start_date: featuredStartDate,
          featured_end_date: featuredEndDate
        })
        .eq('paypal_order_id', orderID)
        .eq('submission_id', submissionId);

      if (updateError) {
        console.error('Failed to update payment status:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update payment status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark submission as featured
      const { error: featuredError } = await supabase
        .from('submissions')
        .update({ featured: true })
        .eq('id', submissionId);

      if (featuredError) {
        console.error('Failed to mark submission as featured:', featuredError);
        // Don't return error here as payment was successful
      }

      console.log('Payment captured and submission featured successfully');
      return new Response(
        JSON.stringify({ success: true, captureID: capture.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('Invalid action:', action);
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PayPal payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getPayPalAccessToken(): Promise<string> {
  // Production PayPal Client ID and Secret
  const clientId = "ASS7CDATty_wFE_ArsuvMaNAkVeRTu_0-AXfW6htus-edLPHmeIeyJXygyFIE9FQIGpEterVd5bid6ft";
  const clientSecret = "ED4S73HO5XO1NX-AQy__91MEYfezffPROWtoKZMdfQzvv8dGIyk3nhmROOLXsvnfE2G5S9UYNKz3TKRh";
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const response = await fetch(`${getPayPalBaseURL()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('PayPal token error:', data);
    throw new Error('Failed to get PayPal access token');
  }

  return data.access_token;
}

function getPayPalBaseURL(): string {
  // Using production environment as specified
  return 'https://api.paypal.com';
}
