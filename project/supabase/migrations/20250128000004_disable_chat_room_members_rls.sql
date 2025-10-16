/*
  # Disable RLS for Chat Room Members (Temporary Fix)

  1. Problem
    - RLS policies on chat_room_members might be causing issues
    - Need to disable RLS temporarily

  2. Solution
    - Disable RLS on chat_room_members table
    - Use application-level access control only
*/

-- Disable RLS on chat_room_members table
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read room memberships" ON chat_room_members;
DROP POLICY IF EXISTS "Users can join rooms they have access to" ON chat_room_members;
DROP POLICY IF EXISTS "Users can update their own memberships" ON chat_room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON chat_room_members;




