
-- Disable email confirmation requirement
UPDATE auth.config 
SET email_confirm_change = false, 
    email_autoconfirm = true;

-- Update the signup flow to not require email confirmation
UPDATE auth.config 
SET signup_enabled = true,
    email_confirm_required = false;
