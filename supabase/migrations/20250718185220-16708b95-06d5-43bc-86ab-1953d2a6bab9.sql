-- Update the image_urls array to have the headshot_image as the first image
UPDATE public.submissions 
SET image_urls = ARRAY[headshot_image] || 
                 (SELECT array_agg(img) 
                  FROM unnest(image_urls) AS img 
                  WHERE img != headshot_image)
WHERE id = '2b8c773c-e380-43d9-905b-809ee899de20';