export interface EmailTemplate {
  type: string;
  name: string;
  description: string;
  category: 'user' | 'vendor' | 'admin' | 'newsletter';
  requiresAdditionalData?: boolean;
}

// Centralized email templates configuration
// All email templates across the system should be registered here
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // User-focused templates
  {
    type: 'welcome',
    name: 'Welcome Email',
    description: 'Welcome new users to the platform',
    category: 'user'
  },
  {
    type: 'notification',
    name: 'General Notification',
    description: 'Send general notifications and updates',
    category: 'user'
  },
  {
    type: 'approval',
    name: 'Content Approval',
    description: 'Notify users about approved articles/content',
    category: 'user'
  },
  {
    type: 'featured',
    name: 'Featured Story',
    description: 'Notify users about featured content',
    category: 'user'
  },
  {
    type: 'recommendation',
    name: 'Recommendation Request',
    description: 'Request recommendations from users for interviews',
    category: 'user'
  },

  // Vendor-focused templates
  {
    type: 'vendor_confirmation',
    name: 'Vendor Application Confirmation',
    description: 'Confirm receipt of vendor application',
    category: 'vendor'
  },
  {
    type: 'vendor_approval',
    name: 'Vendor Application Approved',
    description: 'Notify vendor that their application was approved',
    category: 'vendor'
  },
  {
    type: 'vendor_rejection',
    name: 'Vendor Application Rejected',
    description: 'Notify vendor that their application was rejected',
    category: 'vendor'
  },

  // Admin/Newsletter templates
  {
    type: 'admin_notification',
    name: 'Admin Notification',
    description: 'Send notifications to admin users',
    category: 'admin'
  },
  {
    type: 'newsletter',
    name: 'Newsletter',
    description: 'Send newsletter to subscribers',
    category: 'newsletter',
    requiresAdditionalData: true
  },
  {
    type: 'featured_story_promotion',
    name: 'Featured Story Promotion',
    description: 'Promote featured stories to subscribers',
    category: 'newsletter'
  }
];

// Helper functions
export const getTemplatesByCategory = (category: EmailTemplate['category']) => {
  return EMAIL_TEMPLATES.filter(template => template.category === category);
};

export const getTemplateByType = (type: string) => {
  return EMAIL_TEMPLATES.find(template => template.type === type);
};

export const getAllTemplateTypes = () => {
  return EMAIL_TEMPLATES.map(template => template.type);
};