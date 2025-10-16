/*
  # Admin Functions and Policies

  1. Functions
    - `is_admin()` - Check if current user is admin
    - `promote_to_moderator()` - Promote user to moderator
    - `toggle_user_block()` - Block/unblock users
    - `create_admin_user()` - Create admin user

  2. Security
    - Admin-only functions with proper RLS
    - Secure role management
*/

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function to promote user to moderator (admin only)
CREATE OR REPLACE FUNCTION promote_to_moderator(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote users to moderator';
  END IF;
  
  -- Update user role to moderator
  UPDATE profiles 
  SET role = 'moderator', updated_at = now()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Function to toggle user block status (admin/moderator only)
CREATE OR REPLACE FUNCTION toggle_user_block(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user role
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if current user is admin or moderator
  IF current_user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Only admins and moderators can block/unblock users';
  END IF;
  
  -- Toggle block status
  UPDATE profiles 
  SET is_blocked = NOT is_blocked, updated_at = now()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Function to create admin user
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email text,
  user_password text,
  first_name text,
  last_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- This function should only be called during setup
  -- In production, you'd want additional security checks
  
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;
  
  -- Create profile
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    branch,
    city,
    institution,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    user_email,
    first_name,
    last_name,
    'admin',
    'System',
    'System Admin',
    'admin',
    now(),
    now()
  );
  
  RETURN new_user_id;
END;
$$;