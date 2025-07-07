
-- Create a table for storing form submissions and generated articles
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  background TEXT,
  website TEXT,
  social_media TEXT,
  product_name TEXT,
  category TEXT,
  description TEXT,
  problem_solved TEXT,
  stage TEXT,
  idea_origin TEXT,
  biggest_challenge TEXT,
  proudest_moment TEXT,
  inspiration TEXT,
  motivation TEXT,
  generated_article TEXT,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert submissions (public submission form)
CREATE POLICY "Anyone can create submissions" 
  ON public.submissions 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow anyone to view submissions (for displaying articles)
CREATE POLICY "Anyone can view submissions" 
  ON public.submissions 
  FOR SELECT 
  USING (true);
