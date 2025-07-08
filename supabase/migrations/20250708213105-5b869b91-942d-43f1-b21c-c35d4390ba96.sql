-- Remove hashtags from all articles in the generated_article field
UPDATE submissions 
SET generated_article = regexp_replace(generated_article, '#[A-Za-z0-9_]+', '', 'g')
WHERE generated_article IS NOT NULL 
AND generated_article ~ '#[A-Za-z0-9_]+';