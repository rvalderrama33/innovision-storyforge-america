-- Create a test vendor application with a real user ID
INSERT INTO public.vendor_applications (
  user_id,
  business_name,
  contact_email,
  contact_phone,
  shipping_country,
  vendor_bio,
  status
) VALUES (
  'bfa7a6a3-1ce2-4601-a6ee-c0be0e5634e7',
  'TechGear Innovations',
  'vendor@techgear.com',
  '+1-555-0456',
  'United States',
  'TechGear Innovations is a cutting-edge technology company specializing in smart consumer electronics and IoT devices. Founded in 2020, we focus on creating innovative products that seamlessly integrate into modern lifestyles. Our team of experienced engineers and designers work tirelessly to develop products that are not only technologically advanced but also user-friendly and sustainable. We pride ourselves on our commitment to quality, innovation, and customer satisfaction.',
  'pending'
);

-- Now approve the vendor application to trigger the approval process
SELECT approve_vendor_application(id) FROM public.vendor_applications 
WHERE business_name = 'TechGear Innovations' AND status = 'pending';