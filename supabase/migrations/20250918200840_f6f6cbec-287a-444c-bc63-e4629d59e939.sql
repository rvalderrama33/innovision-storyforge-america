-- Add adult content flag to products
ALTER TABLE public.marketplace_products 
ADD COLUMN is_adult_content boolean NOT NULL DEFAULT false;

-- Add age verification status to profiles
ALTER TABLE public.profiles 
ADD COLUMN age_verified boolean DEFAULT false;