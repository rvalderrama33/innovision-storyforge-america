import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VendorConfirmationRequest {
  application: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application }: VendorConfirmationRequest = await req.json();
    
    console.log("Sending vendor confirmation email for:", application);

    const subject = "Your Vendor Application Has Been Received - America Innovates Marketplace";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
        <h2 style="color: #000000; border-bottom: 2px solid #000000; padding-bottom: 10px;">
          Thank You for Your Vendor Application!
        </h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Dear ${application.business_name},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Thank you for applying to become a vendor with America Innovates Marketplace. 
          We have successfully received your application and are currently reviewing it.
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #000000; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Application Summary:</h3>
          <ul style="color: #555; line-height: 1.6;">
            <li><strong>Business Name:</strong> ${application.business_name}</li>
            <li><strong>Contact Email:</strong> ${application.contact_email}</li>
            <li><strong>Submitted:</strong> ${new Date(application.created_at).toLocaleDateString()}</li>
            <li><strong>Status:</strong> Under Review</li>
          </ul>
        </div>
        
        <h3 style="color: #333;">What happens next?</h3>
        <ul style="color: #555; line-height: 1.6;">
          <li>Our team will review your application within 3-5 business days</li>
          <li>We will verify your business information and product quality standards</li>
          <li>You will receive an email notification with our decision</li>
          <li>If approved, you'll get access to our vendor dashboard to list your products</li>
        </ul>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #000000;">
            <strong>Questions?</strong> Feel free to contact us at 
            <a href="mailto:ricardo@myproduct.today" style="color: #000000;">ricardo@myproduct.today</a>
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          We appreciate your interest in partnering with America Innovates Marketplace 
          and look forward to potentially working together to showcase innovative products.
        </p>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
          <p style="color: #888; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong>The America Innovates Marketplace Team</strong><br>
            America Innovates Marketplace
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "America Innovates Marketplace <admin@americainnovates.us>",
      to: [application.contact_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Vendor confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-vendor-confirmation function:", error);
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