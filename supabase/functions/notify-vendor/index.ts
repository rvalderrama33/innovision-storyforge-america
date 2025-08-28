import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-VENDOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Function started");

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");

    // Create Supabase client using service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      throw new Error("No order ID provided");
    }

    logStep("Processing vendor notification", { orderId: order_id });

    // Get order details with vendor information
    const { data: order, error: orderError } = await supabaseService
      .from('marketplace_orders')
      .select(`
        *,
        order_items (*),
        marketplace_products (
          name,
          vendor_id
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${order_id}`);
    }

    logStep("Order details retrieved", { 
      orderNumber: order.order_number,
      vendorId: order.vendor_id 
    });

    // Get vendor contact information
    const { data: vendorApp, error: vendorError } = await supabaseService
      .from('vendor_applications')
      .select('business_name, contact_email')
      .eq('user_id', order.vendor_id)
      .eq('status', 'approved')
      .single();

    if (vendorError || !vendorApp) {
      throw new Error(`Vendor information not found for user: ${order.vendor_id}`);
    }

    logStep("Vendor details retrieved", { 
      businessName: vendorApp.business_name,
      contactEmail: vendorApp.contact_email 
    });

    // Format order items for email
    const orderItemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.product_price / 100).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.total_amount / 100).toFixed(2)}</td>
      </tr>
    `).join('');

    const formatPrice = (priceInCents: number) => `$${(priceInCents / 100).toFixed(2)}`;
    
    const shippingAddress = order.shipping_address;
    const addressHtml = `
      ${order.customer_name}<br>
      ${shippingAddress.address_line_1}<br>
      ${shippingAddress.address_line_2 ? `${shippingAddress.address_line_2}<br>` : ''}
      ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}<br>
      ${shippingAddress.country || 'US'}
    `;

    // Calculate processing deadline (48 hours from now)
    const processingDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const deadlineFormatted = processingDeadline.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Initialize Resend
    const resend = new Resend(resendKey);

    // Send vendor notification email
    const emailResponse = await resend.emails.send({
      from: 'America Innovates Marketplace <orders@americainnovates.us>',
      to: [vendorApp.contact_email],
      subject: `New Order #${order.order_number} - Action Required`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Order Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">New Order Received!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">America Innovates Marketplace</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
            <div style="background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Hello ${vendorApp.business_name},</h2>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Congratulations! You have received a new order that requires immediate processing.
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h3 style="color: #856404; margin: 0 0 10px 0;">⚠️ URGENT ACTION REQUIRED</h3>
                <p style="color: #856404; margin: 0;">
                  <strong>Processing Deadline: ${deadlineFormatted}</strong><br>
                  You must process this order and submit tracking information within 48 hours.
                </p>
              </div>
              
              <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Details</h3>
              <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                  <td style="padding: 5px 0;">#${order.order_number}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Order Date:</strong></td>
                  <td style="padding: 5px 0;">${new Date(order.created_at).toLocaleDateString('en-US')}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Customer Email:</strong></td>
                  <td style="padding: 5px 0;">${order.customer_email}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Total Amount:</strong></td>
                  <td style="padding: 5px 0; font-size: 18px; font-weight: bold; color: #28a745;">${formatPrice(order.total_amount)}</td>
                </tr>
              </table>
              
              <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Unit Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
              </table>
              
              <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Shipping Address</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                ${addressHtml}
              </div>
              
              <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Next Steps</h3>
              <ol style="padding-left: 20px;">
                <li style="margin-bottom: 10px;">
                  <strong>Process the order immediately</strong> - Package the items for shipment
                </li>
                <li style="margin-bottom: 10px;">
                  <strong>Ship within 48 hours</strong> - Use a trackable shipping method
                </li>
                <li style="margin-bottom: 10px;">
                  <strong>Submit tracking information</strong> - Log into your vendor dashboard and update the order with tracking details
                </li>
                <li style="margin-bottom: 10px;">
                  <strong>Update order status</strong> - Mark as "shipped" once dispatched
                </li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://americainnovates.us/vendor/dashboard" 
                   style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Access Vendor Dashboard
                </a>
              </div>
              
              <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="color: #155724; margin: 0 0 10px 0;">📞 Need Help?</h4>
                <p style="color: #155724; margin: 0;">
                  If you have any questions about this order or need assistance, please contact our vendor support team at 
                  <a href="mailto:vendor-support@americainnovates.us" style="color: #155724;">vendor-support@americainnovates.us</a>
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                This email was sent to you because you are an approved vendor on America Innovates Marketplace.<br>
                <strong>America Innovates Magazine</strong> - Supporting Innovation and Entrepreneurship
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    logStep("Vendor notification email sent successfully", { 
      emailId: emailResponse.data?.id,
      recipientEmail: vendorApp.contact_email 
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Vendor notification sent successfully",
      email_id: emailResponse.data?.id
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      },
      status: 200,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in notify-vendor", { message: errorMessage });
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