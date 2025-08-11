
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
  try {
    const { data, error } = await supabase.functions.invoke('send-admin-notifications', {
      body: {
        type: 'article_submission',
        data: submissionData
      }
    });

    if (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

export const sendVendorApplicationNotification = async (applicationData: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-admin-notifications', {
      body: {
        type: 'vendor_application',
        data: applicationData
      }
    });

    if (error) {
      console.error('Error sending vendor application notification:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

export const sendVendorApplicationConfirmation = async (applicationData: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-vendor-confirmation', {
      body: {
        application: applicationData
      }
    });

    if (error) {
      console.error('Error sending vendor confirmation:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};
