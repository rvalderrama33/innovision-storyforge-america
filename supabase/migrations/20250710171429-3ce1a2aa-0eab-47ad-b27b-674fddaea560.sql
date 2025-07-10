-- Create table to track individual recommendations
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Recommendation details
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  
  -- Source information
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  recommender_name TEXT,
  recommender_email TEXT,
  
  -- Tracking fields
  email_sent_at TIMESTAMP WITH TIME ZONE,
  subscribed_at TIMESTAMP WITH TIME ZONE,
  submitted_story_at TIMESTAMP WITH TIME ZONE,
  submission_id_created UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  
  -- Prevent duplicate recommendations
  UNIQUE(email, submission_id)
);

-- Enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all recommendations" 
ON public.recommendations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert recommendations" 
ON public.recommendations 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_recommendations_updated_at
BEFORE UPDATE ON public.recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for email lookups
CREATE INDEX idx_recommendations_email ON public.recommendations(email);
CREATE INDEX idx_recommendations_submission ON public.recommendations(submission_id);