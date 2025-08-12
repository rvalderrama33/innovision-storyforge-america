-- Create a test submission (this should work)
INSERT INTO public.submissions (
  full_name,
  email,
  city,
  state,
  product_name,
  category,
  description,
  problem_solved,
  stage,
  idea_origin,
  biggest_challenge,
  proudest_moment,
  inspiration,
  motivation,
  generated_article,
  status,
  slug,
  background,
  website,
  social_media,
  phone_number
) VALUES (
  'John Test Innovator',
  'test@example.com',
  'San Francisco',
  'CA',
  'EcoSmart Water Bottle',
  'Technology',
  'A smart water bottle that tracks hydration and reminds users to drink water throughout the day.',
  'Helps people maintain proper hydration levels which is crucial for health and productivity.',
  'MVP',
  'Personal experience with dehydration during long work sessions',
  'Finding the right sensors that are both accurate and battery-efficient',
  'When our prototype helped a diabetes patient better manage their hydration',
  'Seeing how simple technology can make a real difference in peoples daily lives',
  'Making hydration as easy and automatic as possible for everyone',
  'A revolutionary smart water bottle that combines IoT technology with health monitoring to help users maintain optimal hydration levels throughout their day. The EcoSmart Water Bottle features advanced sensors that track water intake, temperature, and even water quality, while sending personalized reminders to your smartphone. This innovative product represents the perfect marriage of sustainability and technology, featuring a durable, eco-friendly design made from recycled materials. The bottle''s smart cap houses sophisticated sensors and a long-lasting battery that can run for weeks on a single charge. Users simply drink from the bottle as they normally would, while the integrated sensors automatically track their hydration levels and sync data to a companion mobile app. The app provides personalized hydration goals based on factors like weather, activity level, and individual health metrics.',
  'pending',
  'ecosmart-water-bottle-test',
  'Software Engineer with 8 years experience in IoT development',
  'https://ecosmartbottle.com',
  '@ecosmartbottle',
  '+1-555-0123'
);

-- Now approve the submission to trigger approval email
UPDATE public.submissions 
SET status = 'approved', 
    approved_at = now(),
    approved_by = auth.uid()
WHERE slug = 'ecosmart-water-bottle-test';