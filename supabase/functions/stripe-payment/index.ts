import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[STRIPE-PAYMENT] Starting function");
    
    // Get environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("[STRIPE-PAYMENT] Environment check:", {
      hasStripeKey: !!stripeKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      stripeKeyType: stripeKey?.substring(0, 3)
    });

    if (!stripeKey) {
      console.error("[STRIPE-PAYMENT] Missing STRIPE_SECRET_KEY");
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!stripeKey.startsWith('sk_')) {
      console.error("[STRIPE-PAYMENT] Wrong key type:", stripeKey.substring(0, 3));
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY must be a secret key (starts with sk_)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[STRIPE-PAYMENT] Missing Supabase config");
      return new Response(JSON.stringify({ error: "Supabase configuration missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("[STRIPE-PAYMENT] Request body:", body);
    } catch (error) {
      console.error("[STRIPE-PAYMENT] Invalid JSON:", error);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { action, submission_id, amount = 5000, session_id } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action parameter" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    console.log("[STRIPE-PAYMENT] Clients initialized");

    if (action === 'create-order') {
      if (!submission_id) {
        return new Response(JSON.stringify({ error: "Missing submission_id for create-order" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      console.log("[STRIPE-PAYMENT] Creating order for submission:", submission_id);

      // Verify submission exists and is approved
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('id, status, featured, product_name')
        .eq('id', submission_id)
        .single();

      console.log("[STRIPE-PAYMENT] Submission query result:", { submission, submissionError });

      if (submissionError || !submission) {
        return new Response(JSON.stringify({ error: `Submission not found: ${submissionError?.message || 'Unknown error'}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      if (submission.status !== 'approved') {
        return new Response(JSON.stringify({ error: 'Submission must be approved before featuring' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Create Stripe checkout session
      console.log("[STRIPE-PAYMENT] Creating Stripe session");
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Featured Story: ${submission.product_name || 'Story'}`,
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

      console.log("[STRIPE-PAYMENT] Stripe session created:", session.id);

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
        console.error("[STRIPE-PAYMENT] Database error:", paymentError);
        return new Response(JSON.stringify({ error: `Failed to create payment record: ${paymentError.message}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      console.log("[STRIPE-PAYMENT] Payment record created successfully");

      return new Response(JSON.stringify({ 
        url: session.url,
        session_id: session.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === 'capture-order') {
      if (!session_id) {
        return new Response(JSON.stringify({ error: "Missing session_id for capture-order" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      console.log("[STRIPE-PAYMENT] Capturing order for session:", session_id);

      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status !== 'paid') {
        return new Response(JSON.stringify({ error: `Payment not completed. Status: ${session.payment_status}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const submission_id_from_session = session.metadata?.submission_id;
      if (!submission_id_from_session) {
        return new Response(JSON.stringify({ error: 'Submission ID not found in session metadata' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      console.log("[STRIPE-PAYMENT] Payment verified, updating database");

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
        console.error("[STRIPE-PAYMENT] Update error:", updateError);
        return new Response(JSON.stringify({ error: `Failed to update payment: ${updateError.message}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      // Update submission to featured
      const { error: submissionUpdateError } = await supabase
        .from('submissions')
        .update({ featured: true })
        .eq('id', submission_id_from_session);

      if (submissionUpdateError) {
        console.error("[STRIPE-PAYMENT] Submission update error:", submissionUpdateError);
        return new Response(JSON.stringify({ error: `Failed to update submission: ${submissionUpdateError.message}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      console.log("[STRIPE-PAYMENT] Successfully completed payment and featured submission");

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Payment completed and story featured successfully'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error("[STRIPE-PAYMENT] CRITICAL ERROR:", {
      message: errorMessage,
      stack: errorStack,
      errorType: error?.constructor?.name
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: "Check edge function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});