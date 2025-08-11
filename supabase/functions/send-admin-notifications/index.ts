import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'article_submission' | 'vendor_application';
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: NotificationRequest = await req.json();
    
    console.log(`Processing ${type} notification:`, data);

    let subject = "";
    let htmlContent = "";

    if (type === 'article_submission') {
      subject = "New Article Submission - America Innovates";
      htmlContent = `
        <h2>New Article Submission Received</h2>
        <p>A new article submission has been received on America Innovates.</p>
        
        <h3>Submission Details:</h3>
        <ul>
          <li><strong>Submitter:</strong> ${data.full_name || 'Not provided'}</li>
          <li><strong>Email:</strong> ${data.email || 'Not provided'}</li>
          <li><strong>Product Name:</strong> ${data.product_name || 'Not provided'}</li>
          <li><strong>Category:</strong> ${data.category || 'Not provided'}</li>
          <li><strong>City, State:</strong> ${data.city && data.state ? `${data.city}, ${data.state}` : 'Not provided'}</li>
          <li><strong>Status:</strong> ${data.status || 'pending'}</li>
          <li><strong>Submitted:</strong> ${new Date(data.created_at).toLocaleString()}</li>
        </ul>
        
        ${data.description ? `
        <h3>Description:</h3>
        <p>${data.description}</p>
        ` : ''}
        
        <p>You can review this submission in the admin dashboard.</p>
        
        <p>Best regards,<br>America Innovates System</p>
      `;
    } else if (type === 'vendor_application') {
      subject = "New Vendor Application - America Innovates";
      htmlContent = `
        <h2>New Vendor Application Received</h2>
        <p>A new vendor application has been received on America Innovates.</p>
        
        <h3>Application Details:</h3>
        <ul>
          <li><strong>Business Name:</strong> ${data.business_name || 'Not provided'}</li>
          <li><strong>Contact Email:</strong> ${data.contact_email || 'Not provided'}</li>
          <li><strong>Contact Phone:</strong> ${data.contact_phone || 'Not provided'}</li>
          <li><strong>Shipping Country:</strong> ${data.shipping_country || 'Not provided'}</li>
          <li><strong>Status:</strong> ${data.status || 'pending'}</li>
          <li><strong>Applied:</strong> ${new Date(data.created_at).toLocaleString()}</li>
        </ul>
        
        ${data.vendor_bio ? `
        <h3>Vendor Bio:</h3>
        <p>${data.vendor_bio}</p>
        ` : ''}
        
        <p>You can review this application in the admin dashboard.</p>
        
        <p>Best regards,<br>America Innovates System</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "America Innovates <onboarding@resend.dev>",
      to: ["ricardo@myproduct.today"],
      subject: subject,
      html: htmlContent,
    });

    console.log("Admin notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-admin-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);