-- Enable the marketplace for public access
UPDATE site_config 
SET value = true, updated_at = now() 
WHERE key = 'marketplace_live';