import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from './emailService';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  full_name?: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  is_active: boolean;
  subscription_source?: string;
  confirmed_at?: string;
}

export interface Newsletter {
  id: string;
  title: string;
  content: string;
  html_content?: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduled_at?: string;
  sent_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  recipient_count: number;
  open_count: number;
  click_count: number;
}

export interface EmailAnalytics {
  id: string;
  newsletter_id: string;
  subscriber_id: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  event_data?: any;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

// Subscribe to newsletter
export const subscribeToNewsletter = async (email: string, fullName?: string) => {
  try {
    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.is_active) {
        throw new Error('You are already subscribed to our newsletter');
      } else {
        // Reactivate subscription - don't send welcome email for reactivations
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .update({
            is_active: true,
            unsubscribed_at: null,
            confirmed_at: new Date().toISOString()
          })
          .eq('email', email)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email,
        full_name: fullName,
        subscription_source: 'website',
        confirmed_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Only send welcome email for new subscriptions from website
    if (data && data.subscription_source === 'website') {
      try {
        await sendWelcomeEmail(email, fullName);
        console.log('Welcome email sent to:', email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't throw here - subscription should still succeed even if email fails
      }
    }

    return data;
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
};

// Unsubscribe from newsletter
export const unsubscribeFromNewsletter = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    throw error;
  }
};

// Get all subscribers (admin only)
export const getNewsletterSubscribers = async () => {
  try {
    console.log('Fetching newsletter subscribers...');
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('is_active', true)
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      throw error;
    }
    
    console.log('Subscribers fetched:', data?.length || 0);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get newsletters (admin only)
export const getNewsletters = async () => {
  try {
    console.log('Fetching newsletters...');
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching newsletters:', error);
      throw error;
    }
    
    console.log('Newsletters fetched:', data?.length || 0);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return []; // Return empty array instead of throwing
  }
};

// Create newsletter (admin only)
export const createNewsletter = async (newsletter: {
  title: string;
  content: string;
  subject: string;
  html_content?: string;
  status?: 'draft' | 'scheduled' | 'sent';
  scheduled_at?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('newsletters')
      .insert(newsletter)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating newsletter:', error);
    throw error;
  }
};

// Update newsletter (admin only)
export const updateNewsletter = async (id: string, updates: Partial<Newsletter>) => {
  try {
    const { data, error } = await supabase
      .from('newsletters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating newsletter:', error);
    throw error;
  }
};

// Get newsletter analytics
export const getNewsletterAnalytics = async (newsletterId?: string) => {
  try {
    let query = supabase
      .from('email_analytics')
      .select(`
        *,
        newsletters!email_analytics_newsletter_id_fkey(id, title, subject, sent_at, recipient_count, open_count, click_count),
        newsletter_subscribers!email_analytics_subscriber_id_fkey(id, email, full_name)
      `);

    if (newsletterId) {
      query = query.eq('newsletter_id', newsletterId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Analytics query error:', error);
      throw error;
    }
    
    console.log('Raw analytics data:', data);
    
    // Transform the data to match the expected structure
    const transformedData = data?.map(item => ({
      ...item,
      newsletter: item.newsletters,
      subscriber: item.newsletter_subscribers
    })) || [];
    
    console.log('Transformed analytics data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching newsletter analytics:', error);
    throw error;
  }
};

// Track email event
export const trackEmailEvent = async (
  newsletterId: string,
  subscriberId: string,
  eventType: EmailAnalytics['event_type'],
  eventData?: any,
  userAgent?: string,
  ipAddress?: string
) => {
  try {
    const { data, error } = await supabase
      .from('email_analytics')
      .insert({
        newsletter_id: newsletterId,
        subscriber_id: subscriberId,
        event_type: eventType,
        event_data: eventData,
        user_agent: userAgent,
        ip_address: ipAddress
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking email event:', error);
    throw error;
  }
};

// Get subscription statistics
export const getSubscriptionStats = async () => {
  try {
    console.log('Fetching subscription stats...');
    // Total subscribers
    const { count: totalSubscribers, error: totalError } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (totalError) {
      console.error('Error fetching total subscribers:', totalError);
      throw totalError;
    }

    // New subscribers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newThisMonth, error: newError } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('subscribed_at', startOfMonth.toISOString());

    if (newError) {
      console.error('Error fetching new subscribers:', newError);
      throw newError;
    }

    // Unsubscribes this month
    const { count: unsubscribesThisMonth, error: unsubError } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
      .gte('unsubscribed_at', startOfMonth.toISOString());

    if (unsubError) {
      console.error('Error fetching unsubscribes:', unsubError);
      throw unsubError;
    }

    const stats = {
      totalSubscribers: totalSubscribers || 0,
      newThisMonth: newThisMonth || 0,
      unsubscribesThisMonth: unsubscribesThisMonth || 0
    };
    
    console.log('Subscription stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return {
      totalSubscribers: 0,
      newThisMonth: 0,
      unsubscribesThisMonth: 0
    }; // Return default stats instead of throwing
  }
};

// Test weekly newsletter generation
export const testWeeklyNewsletter = async (testEmail: string) => {
  try {
    console.log('Testing weekly newsletter generation...');
    const { data, error } = await supabase.functions.invoke('generate-weekly-newsletter', {
      body: { 
        isTest: true, 
        testEmail: testEmail 
      }
    });

    if (error) {
      console.error('Error testing weekly newsletter:', error);
      throw error;
    }

    console.log('Weekly newsletter test completed:', data);
    return data;
  } catch (error) {
    console.error('Error testing weekly newsletter:', error);
    throw error;
  }
};
