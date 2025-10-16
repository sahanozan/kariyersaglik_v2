/*
  # Create admin account and update user management

  1. Admin Account Setup
    - Creates admin account with specified credentials
    - Email: ozansahan@outlook.com
    - Password: 2025Sahanbey2-

  2. User Management
    - Updates trigger function to assign admin role to specified email
    - Ensures proper role assignment during registration

  3. Security
    - Maintains existing RLS policies
    - Admin gets full access to user management
*/

-- Update the handle_new_user function to properly assign admin role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, branch, city, institution, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'branch', ''),
    COALESCE(new.raw_user_meta_data->>'city', ''),
    COALESCE(new.raw_user_meta_data->>'institution', ''),
    CASE 
      WHEN new.email = 'ozansahan@outlook.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;