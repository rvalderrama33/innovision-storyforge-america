import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface TestResult {
  emailType: string;
  status: 'SUCCESS' | 'ERROR';
  message: string;
  responseData?: any;
  error?: string;
}

const testEmailTemplates = [
  {
    type: 'welcome',
    testData: {
      to: 'test-welcome@example.com',
      name: 'Test User Welcome'
    }
  },
  {
    type: 'notification',
    testData: {
      to: 'test-notification@example.com',
      name: 'Test User Notification',
      subject: 'Test Notification Email',
      message: 'This is a comprehensive test of the notification email template functionality.'
    }
  },
  {
    type: 'approval',
    testData: {
      to: 'test-approval@example.com',
      name: 'Test User Approval',
      productName: 'Test Innovation Product',
      slug: 'test-innovation-product-approval'
    }
  },
  {
    type: 'featured',
    testData: {
      to: 'test-featured@example.com',
      name: 'Test User Featured',
      productName: 'Test Featured Product',
      slug: 'test-featured-product-story'
    }
  },
  {
    type: 'recommendation',
    testData: {
      to: 'test-recommendation@example.com',
      name: 'Test User Recommendation',
      recommenderName: 'Test Recommender'
    }
  },
  {
    type: 'featured_story_promotion',
    testData: {
      to: 'test-promotion@example.com',
      name: 'Test User Promotion',
      subject: 'Featured Stories You\'ll Love',
      message: 'Check out these amazing featured stories from innovative entrepreneurs!'
    }
  }
];

const testSingleEmailTemplate = async (template: any): Promise<TestResult> => {
  try {
    console.log(`Testing email template: ${template.type}`);
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: template.type,
        ...template.testData
      }
    });

    if (error) {
      return {
        emailType: template.type,
        status: 'ERROR',
        message: `Failed to send ${template.type} email`,
        error: error.message || JSON.stringify(error)
      };
    }

    return {
      emailType: template.type,
      status: 'SUCCESS',
      message: `Successfully sent ${template.type} email`,
      responseData: data
    };
    
  } catch (error: any) {
    return {
      emailType: template.type,
      status: 'ERROR',
      message: `Exception while testing ${template.type} email`,
      error: error.message || error.toString()
    };
  }
};

const testBulkEmailFunctionality = async (): Promise<TestResult> => {
  try {
    console.log('Testing bulk email functionality by fetching profiles...');
    
    // Test fetching profiles for bulk email
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(3);

    if (profilesError) {
      return {
        emailType: 'bulk_email_profiles',
        status: 'ERROR',
        message: 'Failed to fetch profiles for bulk email test',
        error: profilesError.message
      };
    }

    if (!profiles || profiles.length === 0) {
      return {
        emailType: 'bulk_email_profiles',
        status: 'ERROR',
        message: 'No profiles found for bulk email testing',
        error: 'Empty profiles table'
      };
    }

    return {
      emailType: 'bulk_email_profiles',
      status: 'SUCCESS',
      message: `Successfully fetched ${profiles.length} profiles for bulk email testing`,
      responseData: profiles
    };
    
  } catch (error: any) {
    return {
      emailType: 'bulk_email_profiles',
      status: 'ERROR',
      message: 'Exception while testing bulk email functionality',
      error: error.message || error.toString()
    };
  }
};

const testVendorEmailFunctions = async (): Promise<TestResult[]> => {
  const vendorTests = [
    {
      functionName: 'send-vendor-confirmation',
      testData: {
        application: {
          id: crypto.randomUUID(),
          business_name: 'Test Vendor Confirmation Business',
          contact_email: 'test-vendor-confirm@example.com',
          status: 'pending'
        }
      }
    },
    {
      functionName: 'send-vendor-approval',
      testData: {
        application: {
          id: crypto.randomUUID(),
          business_name: 'Test Vendor Approval Business',
          contact_email: 'test-vendor-approve@example.com',
          status: 'approved'
        }
      }
    },
    {
      functionName: 'send-vendor-rejection',
      testData: {
        application: {
          id: crypto.randomUUID(),
          business_name: 'Test Vendor Rejection Business',
          contact_email: 'test-vendor-reject@example.com',
          status: 'rejected',
          rejection_reason: 'Incomplete application - testing purposes'
        }
      }
    }
  ];

  const results: TestResult[] = [];

  for (const test of vendorTests) {
    try {
      console.log(`Testing vendor function: ${test.functionName}`);
      
      const { data, error } = await supabase.functions.invoke(test.functionName, {
        body: test.testData
      });

      if (error) {
        results.push({
          emailType: test.functionName,
          status: 'ERROR',
          message: `Failed to invoke ${test.functionName}`,
          error: error.message || JSON.stringify(error)
        });
      } else {
        results.push({
          emailType: test.functionName,
          status: 'SUCCESS',
          message: `Successfully invoked ${test.functionName}`,
          responseData: data
        });
      }
      
    } catch (error: any) {
      results.push({
        emailType: test.functionName,
        status: 'ERROR',
        message: `Exception while testing ${test.functionName}`,
        error: error.message || error.toString()
      });
    }
  }

  return results;
};

const testAdminNotificationEmails = async (): Promise<TestResult> => {
  try {
    console.log('Testing admin notification emails...');
    
    const { data, error } = await supabase.functions.invoke('send-admin-notifications', {
      body: {
        type: 'article_submission',
        data: {
          id: crypto.randomUUID(),
          full_name: 'Test Admin Notification User',
          email: 'test-admin-notification@example.com',
          product_name: 'Test Admin Product',
          description: 'Test description for admin notification',
          status: 'pending'
        }
      }
    });

    if (error) {
      return {
        emailType: 'admin_notifications',
        status: 'ERROR',
        message: 'Failed to send admin notification email',
        error: error.message || JSON.stringify(error)
      };
    }

    return {
      emailType: 'admin_notifications',
      status: 'SUCCESS',
      message: 'Successfully sent admin notification email',
      responseData: data
    };
    
  } catch (error: any) {
    return {
      emailType: 'admin_notifications',
      status: 'ERROR',
      message: 'Exception while testing admin notification emails',
      error: error.message || error.toString()
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log("🚀 STARTING COMPREHENSIVE EMAIL SYSTEM TEST");
    
    const allResults: TestResult[] = [];
    let totalTests = 0;
    let successfulTests = 0;
    let failedTests = 0;

    // Test 1: Core email templates via send-email function
    console.log("📧 Testing core email templates...");
    for (const template of testEmailTemplates) {
      try {
        const result = await testSingleEmailTemplate(template);
        allResults.push(result);
        totalTests++;
        if (result.status === 'SUCCESS') successfulTests++;
        else failedTests++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        console.error(`Error testing ${template.type}:`, error);
        allResults.push({
          emailType: template.type,
          status: 'ERROR',
          message: `Failed to test ${template.type}`,
          error: error.message
        });
        totalTests++;
        failedTests++;
      }
    }

    // Test 2: Bulk email functionality
    console.log("📬 Testing bulk email functionality...");
    try {
      const bulkResult = await testBulkEmailFunctionality();
      allResults.push(bulkResult);
      totalTests++;
      if (bulkResult.status === 'SUCCESS') successfulTests++;
      else failedTests++;
    } catch (error: any) {
      console.error("Error testing bulk email:", error);
      allResults.push({
        emailType: 'bulk_email_profiles',
        status: 'ERROR',
        message: 'Failed to test bulk email functionality',
        error: error.message
      });
      totalTests++;
      failedTests++;
    }

    // Test 3: Vendor email functions
    console.log("🏢 Testing vendor email functions...");
    try {
      const vendorResults = await testVendorEmailFunctions();
      allResults.push(...vendorResults);
      totalTests += vendorResults.length;
      vendorResults.forEach(result => {
        if (result.status === 'SUCCESS') successfulTests++;
        else failedTests++;
      });
    } catch (error: any) {
      console.error("Error testing vendor emails:", error);
      allResults.push({
        emailType: 'vendor_email_functions',
        status: 'ERROR',
        message: 'Failed to test vendor email functions',
        error: error.message
      });
      totalTests++;
      failedTests++;
    }

    // Test 4: Admin notification emails
    console.log("👨‍💼 Testing admin notification emails...");
    try {
      const adminResult = await testAdminNotificationEmails();
      allResults.push(adminResult);
      totalTests++;
      if (adminResult.status === 'SUCCESS') successfulTests++;
      else failedTests++;
    } catch (error: any) {
      console.error("Error testing admin notifications:", error);
      allResults.push({
        emailType: 'admin_notifications',
        status: 'ERROR',
        message: 'Failed to test admin notification emails',
        error: error.message
      });
      totalTests++;
      failedTests++;
    }

    // Generate comprehensive report
    const report = {
      testSummary: {
        totalTests,
        successful: successfulTests,
        failed: failedTests,
        successRate: `${Math.round((successfulTests / totalTests) * 100)}%`
      },
      testCategories: {
        coreEmailTemplates: allResults.filter(r => testEmailTemplates.some(t => t.type === r.emailType)),
        bulkEmailSystem: allResults.filter(r => r.emailType === 'bulk_email_profiles'),
        vendorEmailFunctions: allResults.filter(r => r.emailType.startsWith('send-vendor')),
        adminNotifications: allResults.filter(r => r.emailType === 'admin_notifications')
      },
      detailedResults: allResults,
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Add recommendations based on test results
    const failedEmailTypes = allResults.filter(r => r.status === 'ERROR').map(r => r.emailType);
    if (failedEmailTypes.length > 0) {
      report.recommendations.push(`❌ Failed email types need attention: ${failedEmailTypes.join(', ')}`);
    }
    
    if (successfulTests === totalTests) {
      report.recommendations.push('✅ All email systems are functioning correctly!');
    } else if (successfulTests > totalTests * 0.8) {
      report.recommendations.push('⚠️ Most email systems are working, but some need fixes');
    } else {
      report.recommendations.push('🚨 Major email system issues detected - immediate attention required');
    }

    console.log("✅ COMPREHENSIVE EMAIL SYSTEM TEST COMPLETED");
    console.log(`📊 Results: ${successfulTests}/${totalTests} tests passed (${report.testSummary.successRate})`);

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("💥 Critical error in email system test:", error);
    return new Response(
      JSON.stringify({ 
        error: "Critical test failure",
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);