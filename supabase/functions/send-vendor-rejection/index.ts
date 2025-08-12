import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VendorRejectionRequest {
  application: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application }: VendorRejectionRequest = await req.json();
    
    console.log("Sending vendor rejection email for:", application);

    const subject = "Update on Your Vendor Application - America Innovates Marketplace";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
        <h2 style="color: #000000; border-bottom: 2px solid #000000; padding-bottom: 10px;">
          Your Vendor Application Update
        </h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Dear ${application.business_name},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Thank you for your interest in joining the America Innovates Marketplace. 
          After careful review, we are unable to approve your vendor application at this time.
        </p>
        
        ${application.rejection_reason ? `
        <div style="background-color: #f0f9ff; padding: 20px; border-left: 4px solid #000000; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Reason for Decision:</h3>
          <p style="color: #555; line-height: 1.6; margin: 0;">${application.rejection_reason}</p>
        </div>
        ` : ''}
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #000000;">
            <strong>Have Questions?</strong> Feel free to reach out to us at 
            <a href="mailto:ricardo@myproduct.today" style="color: #000000;">ricardo@myproduct.today</a> 
            if you'd like more information about our vendor requirements.
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          We appreciate your interest in America Innovates Marketplace and encourage you to consider 
          applying again in the future if your business situation changes.
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
      from: "America Innovates Marketplace <onboarding@resend.dev>",
      to: [application.contact_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Vendor rejection email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-vendor-rejection function:", error);
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