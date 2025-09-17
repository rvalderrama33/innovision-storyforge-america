import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VendorInvitationRequest {
  inviteEmail: string;
  message: string;
  inviterContext: 'admin' | 'vendor';
  inviterEmail?: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      inviteEmail, 
      message, 
      inviterContext, 
      inviterEmail, 
      inviterName 
    }: VendorInvitationRequest = await req.json();
    
    console.log("Sending vendor invitation email to:", inviteEmail);

    const isAdminInvite = inviterContext === 'admin';
    const fromName = isAdminInvite ? "America Innovates Marketplace" : `${inviterName} via America Innovates`;
    
    const subject = isAdminInvite 
      ? "Invitation to Join America Innovates Marketplace as a Vendor"
      : `${inviterName} invited you to become a vendor on America Innovates Marketplace`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000000; margin: 0; font-size: 28px;">America Innovates</h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 16px;">Marketplace</p>
        </div>
        
        <h2 style="color: #000000; border-bottom: 2px solid #000000; padding-bottom: 10px;">
          You're Invited to Become a Vendor!
        </h2>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-left: 4px solid #000000; margin: 20px 0;">
          ${isAdminInvite ? `
            <p style="margin: 0; color: #333; line-height: 1.6;">
              The America Innovates Marketplace team has personally invited you to join our platform as a vendor.
            </p>
          ` : `
            <p style="margin: 0; color: #333; line-height: 1.6;">
              <strong>${inviterName}</strong> (${inviterEmail}) thought you'd be a great fit for America Innovates Marketplace and sent you this personal invitation.
            </p>
          `}
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6; margin: 0; font-style: italic;">
            "${message}"
          </p>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">Why Join America Innovates Marketplace?</h3>
        <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
          <li>Reach innovation-focused customers and entrepreneurs</li>
          <li>Showcase your products to a curated community</li>
          <li>Benefit from our marketing and promotional efforts</li>
          <li>Join a network of innovative businesses</li>
          <li>Easy-to-use vendor dashboard and tools</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://americainnovates.us/marketplace" 
             style="background-color: #000000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Apply to Become a Vendor
          </a>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #000000; text-align: center;">
            <strong>Ready to get started?</strong><br>
            Visit our marketplace and click "Become a Vendor" to begin your application.
          </p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
          <p style="color: #888; font-size: 14px; margin: 0; text-align: center;">
            Best regards,<br>
            <strong>The America Innovates Marketplace Team</strong><br>
            <a href="https://americainnovates.us" style="color: #000000;">AmericaInnovates.us</a>
          </p>
          
          ${!isAdminInvite ? `
            <p style="color: #888; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
              This invitation was sent by ${inviterName} (${inviterEmail}). 
              If you have questions about this invitation, you can reply directly to them.
            </p>
          ` : ''}
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: `${fromName} <admin@americainnovates.us>`,
      to: [inviteEmail],
      subject: subject,
      html: htmlContent,
      ...(inviterEmail && !isAdminInvite && { replyTo: inviterEmail })
    });

    console.log("Vendor invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in invite-vendor function:", error);
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