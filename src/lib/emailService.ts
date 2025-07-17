import { supabase } from '@/integrations/supabase/client';

interface SendEmailRequest {
  type: 'welcome' | 'notification';
  to: string;
  name?: string;
  subject?: string;
  message?: string;
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
    type: 'notification',
    to: email,
    subject: 'Your story has been approved!',
    message: `Congratulations! Your innovation story "${articleTitle}" has been approved and is now live on America Innovates. <br><br><div style="text-align: center; margin: 20px 0;"><a href="https://americainnovates.us/article/${articleSlug}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Your Published Story</a></div><br>Thank you for sharing your entrepreneurial journey with our community!`,
    name
  });
};

export const sendFeaturedStoryEmail = async (email: string, name: string, articleTitle: string, articleSlug: string) => {
  return sendEmail({
    type: 'notification',
    to: email,
    subject: 'Your story is now featured!',
    message: `Amazing news! Your story "${articleTitle}" has been selected as a featured article on America Innovates. This means it will be prominently displayed on our homepage and reach even more readers. <br><br><div style="text-align: center; margin: 20px 0;"><a href="https://americainnovates.us/article/${articleSlug}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">See Your Featured Story</a></div><br>Congratulations on this achievement!`,
    name
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
