-- Add website and product_types columns to vendor_applications table
ALTER TABLE public.vendor_applications 
ADD COLUMN website text,
ADD COLUMN product_types text;