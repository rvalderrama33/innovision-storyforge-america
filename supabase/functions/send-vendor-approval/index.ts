import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VendorApprovalRequest {
  application: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application }: VendorApprovalRequest = await req.json();
    
    console.log("Sending vendor approval email for:", application);

    const subject = "🎉 Your Vendor Application Has Been Approved - America Innovates Marketplace";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
        <h2 style="color: #000000; border-bottom: 2px solid #000000; padding-bottom: 10px;">
          Congratulations! Your Application Has Been Approved!
        </h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Dear ${application.business_name},
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          We're excited to inform you that your vendor application has been <strong>approved</strong>! 
          Welcome to the America Innovates Marketplace family.
        </p>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-left: 4px solid #000000; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
          <ul style="color: #555; line-height: 1.6;">
            <li>You now have access to the vendor dashboard</li>
            <li>Start adding your innovative products to our marketplace</li>
            <li>Set up your vendor profile and store information</li>
            <li>Begin reaching customers interested in innovation</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://americainnovates.us/vendor-dashboard" 
             style="background-color: #000000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Access Your Vendor Dashboard
          </a>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #000000;">
            <strong>Need Help?</strong> Our team is here to support you. Contact us at 
            <a href="mailto:admin@americainnovates.us" style="color: #000000;">admin@americainnovates.us</a>
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          We're thrilled to have you as part of America Innovates Marketplace and look forward 
          to showcasing your innovative products to our community.
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

    console.log("Vendor approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-vendor-approval function:", error);
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