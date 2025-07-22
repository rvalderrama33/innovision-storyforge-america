-- Update the Enchantails article to have the headshot as the first image
UPDATE public.submissions 
SET image_urls = ARRAY[headshot_image] || 
                 (SELECT array_agg(img) 
                  FROM unnest(image_urls) AS img 
                  WHERE img != headshot_image)
WHERE id = '2c3f1be5-e988-4a2a-b84a-195aa85a9876' 
  AND headshot_image IS NOT NULL;