-- Fix get_deleted_users function with proper return types
-- This function returns deleted users with proper column types

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_deleted_users();

-- Create the function with proper return types
CREATE OR REPLACE FUNCTION get_deleted_users()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  role text,
  city text,
  institution text,
  about text,
  avatar_url text,
  is_blocked boolean,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  deletion_reason text,
  deleted_by uuid,
  deleted_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator') 
    AND is_blocked = false
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Return deleted users with proper types
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name::text,
    p.last_name::text,
    p.email::text,
    p.role::text,
    p.city::text,
    p.institution::text,
    p.about::text,
    p.avatar_url::text,
    p.is_blocked,
    p.created_at,
    p.updated_at,
    p.deleted_at,
    p.deletion_reason::text,
    p.deleted_by,
    CONCAT(del.first_name, ' ', del.last_name)::text as deleted_by_name
  FROM profiles p
  LEFT JOIN profiles del ON p.deleted_by = del.id
  WHERE p.deleted_at IS NOT NULL
  ORDER BY p.deleted_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_deleted_users() TO authenticated;

-- Test the function
SELECT 'get_deleted_users function created successfully' as status;
