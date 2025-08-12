import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoEmailRequest {
  type: 'approval' | 'welcome' | 'submission_notification';
  submissionId?: string;
  subscriberId?: string;
  triggerType?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, submissionId, subscriberId, triggerType }: AutoEmailRequest = await req.json();
    console.log('Processing automatic email:', { type, submissionId, subscriberId, triggerType });

    let result;

    switch (type) {
      case 'approval':
        if (!submissionId) {
          throw new Error('submissionId is required for approval emails');
        }
        result = await sendSubmissionApprovalEmail(submissionId);
        break;

      case 'welcome':
        if (!subscriberId) {
          throw new Error('subscriberId is required for welcome emails');
        }
        result = await sendSubscriberWelcomeEmail(subscriberId);
        break;

      case 'submission_notification':
        if (!submissionId) {
          throw new Error('submissionId is required for submission notifications');
        }
        result = await sendNewSubmissionNotification(submissionId);
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in automatic email sender:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function sendSubmissionApprovalEmail(submissionId: string) {
  try {
    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('status', 'approved')
      .single();

    if (submissionError) {
      throw new Error(`Failed to get submission: ${submissionError.message}`);
    }

    if (!submission) {
      throw new Error('Submission not found or not approved');
    }

    // Send approval email
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'approval',
        to: submission.email,
        name: submission.full_name,
        productName: submission.product_name,
        slug: submission.slug
      }
    });

    if (emailError) {
      throw new Error(`Failed to send approval email: ${emailError.message}`);
    }

    console.log('Approval email sent successfully:', emailResult);
    return emailResult;
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
}

async function sendSubscriberWelcomeEmail(subscriberId: string) {
  try {
    // Get subscriber details
    const { data: subscriber, error: subscriberError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single();

    if (subscriberError) {
      throw new Error(`Failed to get subscriber: ${subscriberError.message}`);
    }

    if (!subscriber || !subscriber.confirmed_at) {
      throw new Error('Subscriber not found or not confirmed');
    }

    // Send welcome email
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'welcome',
        to: subscriber.email,
        name: subscriber.full_name
      }
    });

    if (emailError) {
      throw new Error(`Failed to send welcome email: ${emailError.message}`);
    }

    console.log('Welcome email sent successfully:', emailResult);
    return emailResult;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

async function sendNewSubmissionNotification(submissionId: string) {
  try {
    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      throw new Error(`Failed to get submission: ${submissionError.message}`);
    }

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Send admin notification
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-admin-notifications', {
      body: {
        type: 'article_submission',
        data: submission
      }
    });

    if (emailError) {
      throw new Error(`Failed to send admin notification: ${emailError.message}`);
    }

    console.log('Admin notification sent successfully:', emailResult);
    return emailResult;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw error;
  }
}

serve(handler);