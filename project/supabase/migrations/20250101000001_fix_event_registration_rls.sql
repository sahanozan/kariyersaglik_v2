/*
  # Fix Event Registration RLS Policy

  Problem:
  - Users getting RLS error when trying to register for events
  - Error: "new row violates row-level security policy for table event_registrations"
  - Code: 42501

  Solution:
  - Drop conflicting policies
  - Create comprehensive policies for event_registrations table
  - Ensure proper permissions for event registration
*/

-- Drop all existing policies on event_registrations table
DROP POLICY IF EXISTS "Users can read own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Event creators can read registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON event_registrations;
DROP POLICY IF EXISTS "Event creators can update registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admin can manage all registrations" ON event_registrations;

-- Create comprehensive policies for event_registrations

-- 1. SELECT policy - Users can read their own registrations and event creators can read all registrations for their events
CREATE POLICY "Users can read own registrations and event creators can read all"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own registrations
    (user_id = auth.uid()) OR
    -- Event creators can read all registrations for their events
    (EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.user_id = auth.uid()
    )) OR
    -- Admins and moderators can read all registrations
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
    ))
  );

-- 2. INSERT policy - Users can create registrations for themselves
CREATE POLICY "Users can create their own registrations"
  ON event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can only create registrations for themselves
    (user_id = auth.uid()) AND
    -- Ensure the event exists and is active
    (EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.is_active = true
    ))
  );

-- 3. UPDATE policy - Event creators can update registrations for their events, users can update their own
CREATE POLICY "Event creators and users can update registrations"
  ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own registrations
    (user_id = auth.uid()) OR
    -- Event creators can update registrations for their events
    (EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.user_id = auth.uid()
    )) OR
    -- Admins and moderators can update any registration
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
    ))
  )
  WITH CHECK (
    -- Users can update their own registrations
    (user_id = auth.uid()) OR
    -- Event creators can update registrations for their events
    (EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.user_id = auth.uid()
    )) OR
    -- Admins and moderators can update any registration
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
    ))
  );

-- 4. DELETE policy - Users can delete their own registrations, event creators can delete registrations for their events
CREATE POLICY "Users and event creators can delete registrations"
  ON event_registrations
  FOR DELETE
  TO authenticated
  USING (
    -- Users can delete their own registrations
    (user_id = auth.uid()) OR
    -- Event creators can delete registrations for their events
    (EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.user_id = auth.uid()
    )) OR
    -- Admins and moderators can delete any registration
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
      AND (profiles.is_blocked = false OR profiles.is_blocked IS NULL)
    ))
  );

-- Ensure helper functions exist
CREATE OR REPLACE FUNCTION can_manage_events()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
    AND (is_blocked = false OR is_blocked IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function to verify event registration permissions
CREATE OR REPLACE FUNCTION test_event_registration_permissions(event_id_param uuid)
RETURNS TABLE(
  can_read boolean,
  can_create boolean,
  can_update boolean,
  can_delete boolean,
  user_role text,
  is_event_creator boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Can read if user is registrant, event creator, or admin
    (er.user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM events e WHERE e.id = event_id_param AND e.user_id = auth.uid()) OR
     can_manage_events()) as can_read,
    -- Can create if user is authenticated and event exists
    (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id_param AND e.is_active = true)) as can_create,
    -- Can update if user is registrant, event creator, or admin
    (er.user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM events e WHERE e.id = event_id_param AND e.user_id = auth.uid()) OR
     can_manage_events()) as can_update,
    -- Can delete if user is registrant, event creator, or admin
    (er.user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM events e WHERE e.id = event_id_param AND e.user_id = auth.uid()) OR
     can_manage_events()) as can_delete,
    -- User role
    COALESCE(prof.role, 'user') as user_role,
    -- Is event creator
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id_param AND e.user_id = auth.uid()) as is_event_creator
  FROM event_registrations er
  LEFT JOIN profiles prof ON prof.id = auth.uid()
  WHERE er.event_id = event_id_param
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

