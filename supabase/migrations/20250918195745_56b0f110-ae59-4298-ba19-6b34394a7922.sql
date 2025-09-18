-- Add return_policy column to marketplace_products table
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS return_policy text DEFAULT 'Upon Vendor Approval';

-- Update existing products to have the new return policy
UPDATE public.marketplace_products 
SET return_policy = 'Upon Vendor Approval' 
WHERE return_policy IS NULL;