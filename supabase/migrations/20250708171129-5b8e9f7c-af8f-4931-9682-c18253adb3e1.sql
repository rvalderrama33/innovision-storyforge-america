-- Create storage bucket for submission images
INSERT INTO storage.buckets (id, name, public) VALUES ('submission-images', 'submission-images', true);

-- Create policies for submission images
CREATE POLICY "Anyone can view submission images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'submission-images');

CREATE POLICY "Anyone can upload submission images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'submission-images');

CREATE POLICY "Anyone can update submission images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'submission-images');

CREATE POLICY "Anyone can delete submission images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'submission-images');