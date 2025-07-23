import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StripeOrderRequest {
  action: 'create-order';
  submission_id: string;
  amount?: number;
}

interface StripeCaptureRequest {
  action: 'capture-order';
  session_id: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    
    // Log the key type for debugging (only first few characters for security)
    logStep("Stripe key type", { keyType: stripeKey.substring(0, 3) });
    
    if (!stripeKey.startsWith('sk_')) {
      throw new Error("STRIPE_SECRET_KEY must be a secret key (starts with sk_), not a publishable key (pk_)");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body = await req.json();
    const { action } = body;

    logStep("Processing action", { action });

    if (action === 'create-order') {
      const { submission_id, amount = 5000 } = body as StripeOrderRequest;

      // Verify submission exists and is approved
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('id, status, featured, product_name')
        .eq('id', submission_id)
        .single();

      if (submissionError || !submission) {
        throw new Error(`Submission not found: ${submissionError?.message}`);
      }

      if (submission.status !== 'approved') {
        throw new Error('Submission must be approved before featuring');
      }

      if (submission.featured) {
        throw new Error('Submission is already featured');
      }

      // Check for existing pending or completed payments
      const { data: existingPayment } = await supabase
        .from('featured_story_payments')
        .select('id, status')
        .eq('submission_id', submission_id)
        .in('status', ['pending', 'completed'])
        .single();

      if (existingPayment) {
        throw new Error(`Payment already exists with status: ${existingPayment.status}`);
      }

      logStep("Creating Stripe checkout session", { submission_id, amount });

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Featured Story: ${submission.product_name}`,
                description: 'Feature your story for 30 days',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/payment-cancelled`,
        metadata: {
          submission_id: submission_id,
          amount: amount.toString(),
        },
      });

      logStep("Stripe session created", { sessionId: session.id });

      // Store payment record in database
      const { error: paymentError } = await supabase
        .from('featured_story_payments')
        .insert({
          submission_id,
          stripe_session_id: session.id,
          amount,
          currency: 'USD',
          status: 'pending'
        });

      if (paymentError) {
        logStep("Database error", { error: paymentError });
        throw new Error(`Failed to create payment record: ${paymentError.message}`);
      }

      logStep("Payment record created successfully");

      return new Response(JSON.stringify({ 
        url: session.url,
        session_id: session.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === 'capture-order') {
      const { session_id } = body as StripeCaptureRequest;

      logStep("Retrieving Stripe session", { session_id });

      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status !== 'paid') {
        throw new Error(`Payment not completed. Status: ${session.payment_status}`);
      }

      const submission_id = session.metadata?.submission_id;
      if (!submission_id) {
        throw new Error('Submission ID not found in session metadata');
      }

      logStep("Payment verified, updating database", { submission_id, payment_status: session.payment_status });

      // Update payment status to completed
      const { error: updateError } = await supabase
        .from('featured_story_payments')
        .update({
          status: 'completed',
          stripe_payment_id: session.payment_intent as string,
          featured_start_date: new Date().toISOString(),
          featured_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .eq('stripe_session_id', session_id);

      if (updateError) {
        throw new Error(`Failed to update payment: ${updateError.message}`);
      }

      // Update submission to featured
      const { error: submissionUpdateError } = await supabase
        .from('submissions')
        .update({ featured: true })
        .eq('id', submission_id);

      if (submissionUpdateError) {
        throw new Error(`Failed to update submission: ${submissionUpdateError.message}`);
      }

      logStep("Successfully completed payment and featured submission");

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Payment completed and story featured successfully'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});