-- Block user and cleanup all their content
-- This function will be called when admin/moderator blocks a user

CREATE OR REPLACE FUNCTION block_user_and_cleanup(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
  target_user_role text;
BEGIN
  -- Get current user's role and blocked status
  SELECT role, is_blocked INTO current_user_role, current_user_blocked
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Check if user exists and is not blocked
  IF current_user_role IS NULL OR current_user_blocked = true THEN
    RAISE EXCEPTION 'Unauthorized: User not found or blocked';
  END IF;
  
  -- Check if user is admin or moderator
  IF current_user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Unauthorized: Only admin and moderators can block users';
  END IF;
  
  -- Get target user's role
  SELECT role INTO target_user_role
  FROM profiles 
  WHERE id = user_id;
  
  -- Prevent blocking admin users
  IF target_user_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot block admin users';
  END IF;
  
  -- Block the user
  UPDATE profiles 
  SET 
    is_blocked = true,
    updated_at = now()
  WHERE id = user_id;
  
  -- Delete all their posts
  DELETE FROM posts WHERE user_id = user_id;
  
  -- Delete all their comments
  DELETE FROM comments WHERE user_id = user_id;
  
  -- Delete all their likes
  DELETE FROM likes WHERE user_id = user_id;
  
  -- Delete all their private messages (both sent and received)
  DELETE FROM private_messages WHERE sender_id = user_id OR receiver_id = user_id;
  
  -- Delete all their chat messages
  UPDATE chat_messages 
  SET 
    deleted_at = now(),
    deleted_by = auth.uid()
  WHERE user_id = user_id;
  
  -- Delete all their job applications
  DELETE FROM job_applications WHERE user_id = user_id;
  
  -- Delete all their CV data
  DELETE FROM cv_skills WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = user_id);
  DELETE FROM cv_certifications WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = user_id);
  DELETE FROM cv_educations WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = user_id);
  DELETE FROM cv_experiences WHERE cv_id IN (SELECT id FROM cvs WHERE user_id = user_id);
  DELETE FROM cvs WHERE user_id = user_id;
  
  -- Delete all their friend requests
  DELETE FROM friend_requests WHERE sender_id = user_id OR receiver_id = user_id;
  
  -- Delete all their room memberships
  DELETE FROM chat_room_members WHERE user_id = user_id;
  
  -- Log the action
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    description,
    created_at
  ) VALUES (
    auth.uid(),
    'block_user_cleanup',
    user_id,
    'User blocked and all content deleted',
    now()
  );
  
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION block_user_and_cleanup(uuid) TO authenticated;

-- Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id),
  action_type text NOT NULL,
  target_user_id uuid REFERENCES profiles(id),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on admin_actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy for admin_actions - only admins can see
CREATE POLICY "Only admins can view admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND is_blocked = false
    )
  );
