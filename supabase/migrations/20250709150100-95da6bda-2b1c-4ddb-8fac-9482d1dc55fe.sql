-- Remove all # symbols from Josh Malone article
UPDATE submissions 
SET generated_article = REPLACE(generated_article, '#', '')
WHERE id = 'e901895c-fa83-4794-8757-f87499b807cf';