-- Update Ricardo Valderrama article to change RANSS Corp references to My Product Today
UPDATE submissions 
SET generated_article = REPLACE(generated_article, 'RANSS Corp', 'My Product Today')
WHERE full_name ILIKE '%Ricardo Valderrama%';