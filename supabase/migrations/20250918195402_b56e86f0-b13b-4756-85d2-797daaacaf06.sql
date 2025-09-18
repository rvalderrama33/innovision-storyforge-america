-- Drop the existing vendor management policy
DROP POLICY IF EXISTS "Vendors can manage their own products" ON public.marketplace_products;

-- Create separate policies for vendors and admins
-- Vendors can update their products but cannot set featured to true
CREATE POLICY "Vendors can update their own products" 
ON public.marketplace_products 
FOR UPDATE 
USING (auth.uid() = vendor_id)
WITH CHECK (
  auth.uid() = vendor_id AND
  (featured = false OR featured IS NULL)
);

-- Vendors can delete their own products
CREATE POLICY "Vendors can delete their own products" 
ON public.marketplace_products 
FOR DELETE 
USING (auth.uid() = vendor_id);

-- Vendors can select their own products (and admins can select all)
CREATE POLICY "Vendors can view their own products, admins can view all" 
ON public.marketplace_products 
FOR SELECT 
USING (
  (status = 'active'::text) OR 
  (auth.uid() = vendor_id) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can manage all products including featured status
CREATE POLICY "Admins can manage all products" 
ON public.marketplace_products 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));