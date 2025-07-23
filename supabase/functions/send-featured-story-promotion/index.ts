import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting featured story promotion email job...");

    const { trigger, submission_id } = await req.json();
    console.log("Request data:", { trigger, submission_id });

    // Create Supabase client with service role for admin access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get email customizations for branding
    const { data: emailCustomization } = await supabase
      .from("email_customizations")
      .select("*")
      .single();

    const branding = emailCustomization || {
      company_name: "America Innovates",
      primary_color: "#667eea",
      accent_color: "#764ba2"
    };

    let submissions;
    
    if (trigger === 'manual_single' && submission_id) {
      // Send email to a specific submission
      console.log("Sending promotion email to specific submission:", submission_id);
      
      const { data: singleSubmission, error: fetchError } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", submission_id)
        .eq("status", "approved")
        .not("email", "is", null)
        .single();

      if (fetchError) {
        console.error("Error fetching single submission:", fetchError);
        throw new Error(`Failed to fetch submission: ${fetchError.message}`);
      }

      if (!singleSubmission) {
        console.log("No eligible submission found for the given ID");
        return new Response(
          JSON.stringify({ message: "No eligible submission found for the given ID" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      submissions = [singleSubmission];
    } else {
      // Find submissions approved exactly 24 hours ago that haven't been promoted yet
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { data: autoSubmissions, error: fetchError } = await supabase
        .from("submissions")
        .select("*")
        .eq("status", "approved")
        .eq("featured", false)
        .gte("approved_at", twentyFourHoursAgo.toISOString())
        .lt("approved_at", new Date(twentyFourHoursAgo.getTime() + 3600000).toISOString()) // +1 hour window
        .not("email", "is", null);

      if (fetchError) {
        console.error("Error fetching submissions:", fetchError);
        throw fetchError;
      }

      submissions = autoSubmissions;
    }

    if (!submissions || submissions.length === 0) {
      console.log("No submissions found that need promotion emails");
      return new Response(
        JSON.stringify({ message: "No submissions found for promotion" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${submissions.length} submissions to promote`);

    const emailResults = [];

    // Send promotion email to each submission author
    for (const submission of submissions) {
      try {
        const upgradeUrl = `${Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "https://enckzbxifdrihnfcqagb.supabase.co"}/functions/v1/stripe-payment?submission_id=${submission.id}&action=upgrade-to-featured`;

        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Upgrade Your Story to Featured</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${branding.primary_color}, ${branding.accent_color}); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${branding.company_name}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Magazine</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">🎉 Your Story Has Been Approved!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Congratulations ${submission.full_name || "Innovator"}! We're excited to share that your story 
                <strong>"${submission.product_name}"</strong> has been approved and will be published in our magazine.
              </p>

              <!-- Upgrade Offer Section -->
              <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 12px; padding: 30px; margin: 30px 0; border-left: 4px solid ${branding.primary_color};">
                <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 20px;">
                  ⭐ Upgrade to Featured Story
                </h3>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  Take your story to the next level! For just <strong>$50</strong>, you can upgrade to a Featured Story and get:
                </p>
                
                <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
                  <li><strong>Front Page Placement</strong> - Your story prominently displayed on our magazine's front page</li>
                  <li><strong>30 Days of Exposure</strong> - Featured placement for a full month</li>
                  <li><strong>Newsletter Feature</strong> - Highlighted in our weekly newsletter to thousands of subscribers</li>
                  <li><strong>Increased Visibility</strong> - Reach more potential customers, investors, and partners</li>
                  <li><strong>Priority Placement</strong> - Stand out from other stories</li>
                </ul>

                <div style="text-align: center;">
                  <a href="${upgradeUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, ${branding.primary_color}, ${branding.accent_color}); 
                            color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                            font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    Upgrade to Featured - $50
                  </a>
                </div>
              </div>

              <!-- Story Details -->
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #1f2937; margin: 0 0 10px; font-size: 18px;">Your Story Details:</h4>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Product:</strong> ${submission.product_name}</p>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Category:</strong> ${submission.category || "Innovation"}</p>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Submitted by:</strong> ${submission.full_name}</p>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                This limited-time offer gives you maximum exposure for your innovation story. 
                Featured stories typically receive 5x more views and engagement than regular stories.
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Questions about the featured upgrade? Simply reply to this email and we'll be happy to help.
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f3f4f6; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                ${branding.company_name} - Celebrating Innovation and Entrepreneurship
              </p>
              <p style="color: #9ca3af; margin: 5px 0 0; font-size: 12px;">
                This email was sent to ${submission.email}
              </p>
            </div>
          </div>
        </body>
        </html>
        `;

        const emailResult = await resend.emails.send({
          from: `${branding.company_name} <noreply@resend.dev>`,
          to: [submission.email],
          subject: `🎉 Your Story is Approved! Upgrade to Featured for Maximum Exposure`,
          html: emailHtml,
        });

        console.log(`Promotion email sent to ${submission.email}:`, emailResult);
        emailResults.push({
          submission_id: submission.id,
          email: submission.email,
          result: emailResult
        });

      } catch (error) {
        console.error(`Failed to send email to ${submission.email}:`, error);
        emailResults.push({
          submission_id: submission.id,
          email: submission.email,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${submissions.length} submissions`,
        results: emailResults
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in featured story promotion function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});