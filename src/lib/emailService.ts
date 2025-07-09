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