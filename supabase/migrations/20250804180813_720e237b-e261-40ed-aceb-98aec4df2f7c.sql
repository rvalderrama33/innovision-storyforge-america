-- Add video_urls field to marketplace_products table
ALTER TABLE marketplace_products 
ADD COLUMN video_urls TEXT[] DEFAULT '{}';