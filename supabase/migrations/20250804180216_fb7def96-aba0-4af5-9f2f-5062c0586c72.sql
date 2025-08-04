-- Add primary_image_index field to marketplace_products table
ALTER TABLE marketplace_products 
ADD COLUMN primary_image_index INTEGER DEFAULT 0;