-- Create vendor applications table to track approval status
CREATE TABLE public.vendor_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  shipping_country text,
  vendor_bio text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can create their own application" 
ON public.vendor_applications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own application" 
ON public.vendor_applications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all applications" 
ON public.vendor_applications 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_vendor_applications_updated_at
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to approve vendor application
CREATE OR REPLACE FUNCTION public.approve_vendor_application(_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  app_user_id uuid;
BEGIN
  -- Get the user_id from the application
  SELECT user_id INTO app_user_id 
  FROM public.vendor_applications 
  WHERE id = _application_id AND status = 'pending';
  
  IF app_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update application status
  UPDATE public.vendor_applications 
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = _application_id;
  
  -- Add vendor role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (app_user_id, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile with business name
  UPDATE public.profiles 
  SET full_name = (
    SELECT business_name 
    FROM public.vendor_applications 
    WHERE id = _application_id
  ),
  updated_at = now()
  WHERE id = app_user_id;
  
  RETURN true;
END;
$$;

-- Function to reject vendor application
CREATE OR REPLACE FUNCTION public.reject_vendor_application(_application_id uuid, _reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update application status
  UPDATE public.vendor_applications 
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    rejection_reason = _reason,
    updated_at = now()
  WHERE id = _application_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$;