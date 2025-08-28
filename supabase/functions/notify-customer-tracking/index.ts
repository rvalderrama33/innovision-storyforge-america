import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-CUSTOMER] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started");

  try {
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      throw new Error("Order ID is required");
    }

    logStep("Processing customer notification", { orderId: order_id });

    // Get order details
    const { data: order, error: orderError } = await supabaseService
      .from('marketplace_orders')
      .select(`
        *,
        product:marketplace_products(name, images),
        vendor:profiles!marketplace_orders_vendor_id_fkey(full_name, email)
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to fetch order: ${orderError?.message}`);
    }

    if (!order.customer_email || !order.tracking_number) {
      throw new Error("Customer email or tracking number missing");
    }

    logStep("Order details retrieved", { 
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      trackingNumber: order.tracking_number 
    });

    // Send tracking notification email
    const emailData = await resend.emails.send({
      from: 'America Innovates <orders@americainnovates.us>',
      to: [order.customer_email],
      subject: `Your Order Has Shipped! - ${order.product?.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Shipped</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .tracking-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .tracking-number { font-size: 24px; font-weight: bold; color: #667eea; font-family: monospace; }
            .product-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>  
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Your Order Has Shipped!</h1>
              <p>Great news! Your order is on its way to you.</p>
            </div>
            
            <div class="content">
              <div class="product-info">
                <h2>Order Details</h2>
                <p><strong>Product:</strong> ${order.product?.name}</p>
                <p><strong>Order Number:</strong> ${order.order_number}</p>
                <p><strong>Quantity:</strong> ${order.quantity}</p>
                <p><strong>Total:</strong> $${(order.total_amount / 100).toFixed(2)}</p>
              </div>

              <div class="tracking-box">
                <h3>🚚 Track Your Package</h3>
                <p>Your tracking number is:</p>
                <div class="tracking-number">${order.tracking_number}</div>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                  Please allow 24-48 hours for tracking information to appear in the carrier's system.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p>Need help with your order? Reply to this email or contact our support team.</p>
              </div>

              <div class="footer">
                <p>Thank you for supporting American innovation!</p>
                <p><strong>America Innovates Marketplace</strong></p>
                <p>This email was sent regarding your order ${order.order_number}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    logStep("Customer notification email sent successfully", { 
      emailId: emailData.data?.id,
      recipientEmail: order.customer_email 
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Customer notification sent successfully"
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in notify-customer-tracking", { message: errorMessage });
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