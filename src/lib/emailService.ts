
import { supabase } from '@/integrations/supabase/client';

interface SendEmailRequest {
  type: 'welcome' | 'notification' | 'approval' | 'featured' | 'recommendation';
  to: string;
  name?: string;
  subject?: string;
  message?: string;
  productName?: string;
  slug?: string;
  recommenderName?: string;
}

export const sendEmail = async (emailData: SendEmailRequest) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email: string, name?: string) => {
  return sendEmail({
    type: 'welcome',
    to: email,
    name
  });
};

export const sendNotificationEmail = async (
  email: string, 
  subject: string, 
  message: string, 
  name?: string
) => {
  return sendEmail({
    type: 'notification',
    to: email,
    subject,
    message,
    name
  });
};

export const sendArticleApprovalEmail = async (email: string, name: string, articleTitle: string, articleSlug: string) => {
  return sendEmail({
    type: 'approval',
    to: email,
    name,
    productName: articleTitle,
    slug: articleSlug
  });
};

export const sendFeaturedStoryEmail = async (email: string, name: string, articleTitle: string, articleSlug: string) => {
  return sendEmail({
    type: 'featured',
    to: email,
    name,
    productName: articleTitle,
    slug: articleSlug
  });
};

export const sendNewSubmissionNotification = async (submissionData: any) => {
  return sendEmail({
    type: 'notification',
    to: 'ricardo@myproduct.today',
    subject: 'New Article Submission Received',
    message: `A new article submission has been received:<br><br><strong>Title:</strong> ${submissionData.product_name}<br><strong>Submitter:</strong> ${submissionData.full_name}<br><strong>Email:</strong> ${submissionData.email}<br><strong>Category:</strong> ${submissionData.category}<br><br>Please review the submission in the admin dashboard.`,
    name: 'Ricardo'
  });
};
