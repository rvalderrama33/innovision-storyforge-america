-- Remove all hashtags (including title hashtags) from manually created articles
UPDATE submissions 
SET generated_article = regexp_replace(generated_article, '#+ ?', '', 'g')
WHERE is_manual_submission = true 
AND generated_article IS NOT NULL 
AND generated_article ~ '#';