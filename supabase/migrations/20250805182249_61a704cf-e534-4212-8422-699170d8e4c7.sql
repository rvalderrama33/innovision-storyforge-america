-- Add affiliate_price column to marketplace_products table
ALTER TABLE public.marketplace_products 
ADD COLUMN affiliate_price TEXT;