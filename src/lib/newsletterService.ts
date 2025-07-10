import { supabase } from '@/integrations/supabase/client';

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
        // Reactivate subscription
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
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('is_active', true)
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error);
    throw error;
  }
};

// Get newsletters (admin only)
export const getNewsletters = async () => {
  try {
    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    throw error;
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
        newsletter:newsletters(title, subject),
        subscriber:newsletter_subscribers(email, full_name)
      `);

    if (newsletterId) {
      query = query.eq('newsletter_id', newsletterId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    // Total subscribers
    const { count: totalSubscribers } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // New subscribers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newThisMonth } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('subscribed_at', startOfMonth.toISOString());

    // Unsubscribes this month
    const { count: unsubscribesThisMonth } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
      .gte('unsubscribed_at', startOfMonth.toISOString());

    return {
      totalSubscribers: totalSubscribers || 0,
      newThisMonth: newThisMonth || 0,
      unsubscribesThisMonth: unsubscribesThisMonth || 0
    };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    throw error;
  }
};