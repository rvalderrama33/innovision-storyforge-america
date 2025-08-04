-- Add sales_links column to marketplace_products table
ALTER TABLE public.marketplace_products 
ADD COLUMN sales_links text[] DEFAULT NULL;