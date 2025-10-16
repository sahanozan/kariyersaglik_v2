/*
  # Update posts table for media support

  1. Changes
    - Ensure media_urls column exists and has proper default
    - Update post_type enum to include new types
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Update post_type constraint to include new types
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_post_type_check' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_post_type_check;
  END IF;
END $$;

-- Add new constraint with all post types
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
CHECK (post_type = ANY (ARRAY['genel'::text, 'vaka'::text, 'soru'::text, 'etkinlik'::text, 'anket'::text]));

-- Ensure media_urls column exists with proper default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE posts ADD COLUMN media_urls text[] DEFAULT '{}';
  ELSE
    -- Update default if column exists but doesn't have default
    ALTER TABLE posts ALTER COLUMN media_urls SET DEFAULT '{}';
  END IF;
END $$;

-- Add index for media_urls if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'posts' AND indexname = 'idx_posts_media_urls'
  ) THEN
    CREATE INDEX idx_posts_media_urls ON posts USING gin(media_urls);
  END IF;
END $$;