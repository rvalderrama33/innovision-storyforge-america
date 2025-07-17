
-- Add new image columns to the submissions table
ALTER TABLE public.submissions 
ADD COLUMN banner_image text,
ADD COLUMN headshot_image text, 
ADD COLUMN logo_image text;
