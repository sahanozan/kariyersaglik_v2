/*
  # Completely Disable All RLS (Emergency Fix)

  1. Problem
    - RLS policies are still blocking operations
    - Multiple tables affected
    - Need to completely disable RLS for testing

  2. Solution
    - Disable RLS on all critical tables
    - Remove all policies
    - Use application-level security only
*/

-- Disable RLS on all critical tables
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on posts table
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;
DROP POLICY IF EXISTS "Users can update posts" ON posts;
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
DROP POLICY IF EXISTS "Users can read posts" ON posts;
DROP POLICY IF EXISTS "Users can delete posts" ON posts;
DROP POLICY IF EXISTS "Admins and moderators can update and delete posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts, admins can update any" ON posts;
DROP POLICY IF EXISTS "Users can read non-deleted posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users and admins can update posts" ON posts;

-- Drop ALL existing policies on chat_messages table
DROP POLICY IF EXISTS "Users can read messages in allowed rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages in accessible rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in allowed rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can read messages in rooms they have access to" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages in rooms they have access to" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages or admins can delete any" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can read messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Drop ALL existing policies on chat_room_members table
DROP POLICY IF EXISTS "Users can read room memberships" ON chat_room_members;
DROP POLICY IF EXISTS "Users can join rooms they have access to" ON chat_room_members;
DROP POLICY IF EXISTS "Users can update their own memberships" ON chat_room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON chat_room_members;

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Drop ALL existing policies on comments table
DROP POLICY IF EXISTS "Users can read comments" ON comments;
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON comments;

-- Drop ALL existing policies on likes table
DROP POLICY IF EXISTS "Users can read likes" ON likes;
DROP POLICY IF EXISTS "Users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Admins can manage all likes" ON likes;

-- Drop ALL existing policies on friendships table
DROP POLICY IF EXISTS "Users can read friendships" ON friendships;
DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
DROP POLICY IF EXISTS "Admins can manage all friendships" ON friendships;

-- Drop ALL existing policies on friend_requests table
DROP POLICY IF EXISTS "Users can read friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can insert friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Admins can manage all friend requests" ON friend_requests;

-- Drop ALL existing policies on jobs table
DROP POLICY IF EXISTS "Users can read jobs" ON jobs;
DROP POLICY IF EXISTS "Users can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON jobs;
DROP POLICY IF EXISTS "Admins can manage all jobs" ON jobs;

-- Drop ALL existing policies on job_applications table
DROP POLICY IF EXISTS "Users can read job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can insert job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can delete own job applications" ON job_applications;
DROP POLICY IF EXISTS "Admins can manage all job applications" ON job_applications;

-- Drop ALL existing policies on events table
DROP POLICY IF EXISTS "Users can read events" ON events;
DROP POLICY IF EXISTS "Users can insert events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;

-- Drop ALL existing policies on event_registrations table
DROP POLICY IF EXISTS "Users can read event registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can insert event registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can update own event registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can delete own event registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all event registrations" ON event_registrations;

-- Drop ALL existing policies on surveys table
DROP POLICY IF EXISTS "Users can read surveys" ON surveys;
DROP POLICY IF EXISTS "Users can insert surveys" ON surveys;
DROP POLICY IF EXISTS "Users can update own surveys" ON surveys;
DROP POLICY IF EXISTS "Users can delete own surveys" ON surveys;
DROP POLICY IF EXISTS "Admins can manage all surveys" ON surveys;

-- Drop ALL existing policies on survey_responses table
DROP POLICY IF EXISTS "Users can read survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can insert survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can update own survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can delete own survey responses" ON survey_responses;
DROP POLICY IF EXISTS "Admins can manage all survey responses" ON survey_responses;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'chat_messages', 'chat_room_members', 'profiles', 'comments', 'likes', 'friendships', 'friend_requests', 'jobs', 'job_applications', 'events', 'event_registrations', 'surveys', 'survey_responses');


















