-- Add variant support to marketplace_products table
ALTER TABLE public.marketplace_products 
ADD COLUMN variants jsonb DEFAULT '[]'::jsonb,
ADD COLUMN variant_options jsonb DEFAULT '{}'::jsonb,
ADD COLUMN has_variants boolean DEFAULT false;

-- Add index for better performance on variant queries
CREATE INDEX idx_marketplace_products_variants ON public.marketplace_products USING GIN(variants);
CREATE INDEX idx_marketplace_products_variant_options ON public.marketplace_products USING GIN(variant_options);

-- Add comments for documentation
COMMENT ON COLUMN public.marketplace_products.variants IS 'Array of product variants with attributes, pricing, and inventory';
COMMENT ON COLUMN public.marketplace_products.variant_options IS 'Available options for each variant attribute (color, size, style, etc.)';
COMMENT ON COLUMN public.marketplace_products.has_variants IS 'Flag to indicate if product has variants';