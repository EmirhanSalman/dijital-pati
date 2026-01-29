-- ============================================
-- ADD 'contact' TYPE TO NOTIFICATIONS
-- ============================================
-- This migration adds 'contact' as a valid notification type
-- to support contact email notifications for pet owners

-- Drop the existing constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with 'contact' type included
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('reply', 'lost_pet_found', 'mention', 'system', 'contact'));


