import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManualVendorRequest {
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  productTypes: string;
  shippingCountry?: string;
  vendorBio?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { 
      businessName, 
      contactEmail, 
      contactPhone, 
      website, 
      productTypes, 
      shippingCountry, 
      vendorBio 
    }: ManualVendorRequest = await req.json();

    console.log("Creating manual vendor for:", contactEmail);

    // First, check if a user exists with this email
    let userId: string;
    
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', contactEmail)
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      
      // Check if this user already has a vendor application
      const { data: existingApplication } = await supabaseAdmin
        .from('vendor_applications')
        .select('id, status')
        .eq('user_id', userId)
        .single();

      if (existingApplication) {
        return new Response(
          JSON.stringify({ 
            error: `User already has a ${existingApplication.status} vendor application` 
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else {
      // Create a user account for this email using admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: contactEmail,
        email_confirm: true,
        user_metadata: {
          full_name: businessName
        }
      });

      if (authError) {
        console.error("Error creating user:", authError);
        throw authError;
      }

      userId = authData.user.id;
    }

    // Create the vendor application
    const { data: applicationData, error: applicationError } = await supabaseAdmin
      .from('vendor_applications')
      .insert([
        {
          user_id: userId,
          business_name: businessName,
          contact_email: contactEmail,
          contact_phone: contactPhone || null,
          website: website || null,
          product_types: productTypes,
          shipping_country: shippingCountry || null,
          vendor_bio: vendorBio || null,
          status: 'approved'
        }
      ])
      .select()
      .single();

    if (applicationError) {
      console.error("Error creating vendor application:", applicationError);
      throw applicationError;
    }

    // Add vendor role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role: 'vendor'
        }
      ]);

    if (roleError && roleError.code !== '23505') { // Ignore duplicate key error
      console.error("Error adding vendor role:", roleError);
      throw roleError;
    }

    // Update profile with business name
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: contactEmail,
        full_name: businessName
      });

    // Send approval email
    try {
      const emailResponse = await supabaseAdmin.functions.invoke('send-vendor-approval', {
        body: {
          application: applicationData
        }
      });
      console.log("Approval email sent:", emailResponse);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the creation if email fails
    }

    console.log("Manual vendor created successfully:", applicationData);

    return new Response(JSON.stringify({ 
      success: true, 
      vendor: applicationData,
      message: `Vendor "${businessName}" created and approved successfully!`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in create-vendor-manually function:", error);
    
    let errorMessage = 'Failed to create vendor. Please try again.';
    if (error.code === '23505') {
      errorMessage = 'A vendor with this email already exists';
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);