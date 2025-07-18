-- Update the image_urls array to have the headshot_image as the first image
UPDATE public.submissions 
SET image_urls = ARRAY['https://enckzbxifdrihnfcqagb.supabase.co/storage/v1/object/public/submission-images/headshot/1752775418179-ypiylay85p.jpg'::text] || 
                 ARRAY(SELECT unnest(image_urls) WHERE unnest(image_urls) != 'https://enckzbxifdrihnfcqagb.supabase.co/storage/v1/object/public/submission-images/headshot/1752775418179-ypiylay85p.jpg')
WHERE id = '2b8c773c-e380-43d9-905b-809ee899de20';