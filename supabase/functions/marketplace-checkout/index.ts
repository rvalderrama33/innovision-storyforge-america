import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MARKETPLACE-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

    // Create Supabase client using service role key for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { items, shipping_address, customer_email, customer_name } = body;

    if (!items || items.length === 0) {
      throw new Error("No items provided");
    }

    logStep("Request data validated", { itemCount: items.length, customerEmail: customer_email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get product details and calculate total
    let lineItems = [];
    let totalAmount = 0;
    const cartItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabaseService
        .from('marketplace_products')
        .select('*')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      lineItems.push({
        price_data: {
          currency: product.currency.toLowerCase(),
          product_data: {
            name: product.name,
            description: product.description?.substring(0, 200) || undefined,
            images: product.images?.slice(0, 8) || undefined,
            metadata: {
              product_id: product.id,
              vendor_id: product.vendor_id
            }
          },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      });

      cartItems.push({
        product_id: product.id,
        quantity: item.quantity
      });
    }

    logStep("Products validated", { totalAmount, lineItemCount: lineItems.length });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ 
      email: customer_email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        name: customer_name,
        address: {
          line1: shipping_address.address_line_1,
          line2: shipping_address.address_line_2 || undefined,
          city: shipping_address.city,
          state: shipping_address.state,
          postal_code: shipping_address.postal_code,
          country: shipping_address.country || 'US'
        }
      });
      customerId = customer.id;
      logStep("New Stripe customer created", { customerId });
    }

    // Create Stripe checkout session
    const origin = req.headers.get("origin") || "https://americainnovates.us";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/marketplace-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          customer_email: customer_email,
          customer_name: customer_name,
          cart_items: JSON.stringify(cartItems),
          shipping_address: JSON.stringify(shipping_address)
        }
      },
      shipping_address_collection: {
        allowed_countries: ['US']
      },
      metadata: {
        user_id: user.id,
        cart_items: JSON.stringify(cartItems)
      }
    });

    logStep("Stripe checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      totalAmount 
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in marketplace-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
      status: 500,
    });
  }
});