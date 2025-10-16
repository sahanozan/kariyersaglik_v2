-- Add CV information to profiles table

-- Add CV-related columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialization text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills text[];

-- Update existing columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON profiles(institution);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles(specialization);

-- Show updated table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
  AND column_name IN ('cv_url', 'experience_years', 'specialization', 'education', 'certifications', 'skills', 'institution', 'city')
ORDER BY column_name;






