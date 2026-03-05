-- Fix gender constraint in profiles table
-- This SQL removes the gender constraint to allow free text input

-- First, check current constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass AND conname LIKE '%gender%';

-- Drop the gender constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;

-- Alternatively, change gender column to TEXT type if needed
-- ALTER TABLE profiles ALTER COLUMN gender TYPE TEXT;

-- Verify the constraint is removed
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass AND conname LIKE '%gender%';

-- Show current gender column type
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'gender';