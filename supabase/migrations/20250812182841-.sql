-- Enable RLS on published_articles_public view and create policy for public access
ALTER TABLE published_articles_public ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view published articles
CREATE POLICY "Anyone can view published articles" 
ON published_articles_public 
FOR SELECT 
USING (true);