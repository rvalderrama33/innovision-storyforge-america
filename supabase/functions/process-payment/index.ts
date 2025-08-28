import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started");

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Create Supabase client using service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      throw new Error("No session ID provided");
    }

    logStep("Processing payment for session", { sessionId: session_id });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    logStep("Payment confirmed", { 
      sessionId: session_id, 
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total 
    });

    // Get payment intent to access metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    const metadata = paymentIntent.metadata;

    const userId = metadata.user_id;
    const customerEmail = metadata.customer_email;
    const customerName = metadata.customer_name;
    const cartItems = JSON.parse(metadata.cart_items);
    const shippingAddress = JSON.parse(metadata.shipping_address);

    logStep("Retrieved payment metadata", { 
      userId, 
      customerEmail, 
      itemCount: cartItems.length 
    });

    // Create order using the database function
    const { data: orderId, error: orderError } = await supabaseService
      .rpc('create_order_with_items', {
        p_buyer_id: userId,
        p_customer_email: customerEmail,
        p_customer_name: customerName,
        p_shipping_address: shippingAddress,
        p_payment_intent_id: session.payment_intent as string,
        p_cart_items: cartItems
      });

    if (orderError) {
      logStep("Error creating order", { error: orderError });
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created successfully", { orderId });

    // Clear the user's cart
    const { error: cartError } = await supabaseService
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (cartError) {
      logStep("Warning: Failed to clear cart", { error: cartError });
    } else {
      logStep("Cart cleared successfully");
    }

    // Send vendor notification
    try {
      const { error: notificationError } = await supabaseService.functions.invoke('notify-vendor', {
        body: { order_id: orderId }
      });

      if (notificationError) {
        logStep("Warning: Failed to send vendor notification", { error: notificationError });
      } else {
        logStep("Vendor notification sent successfully");
      }
    } catch (notifError) {
      logStep("Warning: Vendor notification failed", { error: notifError });
    }

    return new Response(JSON.stringify({ 
      success: true,
      order_id: orderId,
      message: "Payment processed successfully"
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-payment", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
      status: 500,
    });
  }
});