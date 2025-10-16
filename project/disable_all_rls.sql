-- Disable All RLS Policies
-- Bu dosya tüm RLS politikalarını devre dışı bırakır

-- 1. Tüm RLS politikalarını devre dışı bırak
-- ===========================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE cvs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_educations DISABLE ROW LEVEL SECURITY;
ALTER TABLE algorithms DISABLE ROW LEVEL SECURITY;
ALTER TABLE drugs DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;

-- 2. Tüm politikaları sil
-- =======================
-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own_simple" ON profiles;

-- Posts
DROP POLICY IF EXISTS "posts_select" ON posts;
DROP POLICY IF EXISTS "posts_insert" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;
DROP POLICY IF EXISTS "posts_select_simple" ON posts;
DROP POLICY IF EXISTS "posts_insert_simple" ON posts;
DROP POLICY IF EXISTS "posts_update_simple" ON posts;
DROP POLICY IF EXISTS "posts_delete_simple" ON posts;

-- Comments
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_update" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;
DROP POLICY IF EXISTS "comments_select_simple" ON comments;
DROP POLICY IF EXISTS "comments_insert_simple" ON comments;
DROP POLICY IF EXISTS "comments_update_simple" ON comments;
DROP POLICY IF EXISTS "comments_delete_simple" ON comments;

-- Likes
DROP POLICY IF EXISTS "likes_select" ON likes;
DROP POLICY IF EXISTS "likes_insert" ON likes;
DROP POLICY IF EXISTS "likes_delete" ON likes;
DROP POLICY IF EXISTS "likes_select_simple" ON likes;
DROP POLICY IF EXISTS "likes_insert_simple" ON likes;
DROP POLICY IF EXISTS "likes_delete_simple" ON likes;

-- Job Listings
DROP POLICY IF EXISTS "job_listings_select" ON job_listings;
DROP POLICY IF EXISTS "job_listings_insert" ON job_listings;
DROP POLICY IF EXISTS "job_listings_update" ON job_listings;
DROP POLICY IF EXISTS "job_listings_delete" ON job_listings;
DROP POLICY IF EXISTS "job_listings_select_simple" ON job_listings;
DROP POLICY IF EXISTS "job_listings_insert_simple" ON job_listings;
DROP POLICY IF EXISTS "job_listings_update_simple" ON job_listings;
DROP POLICY IF EXISTS "job_listings_delete_simple" ON job_listings;

-- Chat Messages
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_simple" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_simple" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_update_simple" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_simple" ON chat_messages;

-- Private Messages
DROP POLICY IF EXISTS "private_messages_select" ON private_messages;
DROP POLICY IF EXISTS "private_messages_insert" ON private_messages;
DROP POLICY IF EXISTS "private_messages_update" ON private_messages;
DROP POLICY IF EXISTS "private_messages_delete" ON private_messages;
DROP POLICY IF EXISTS "private_messages_select_simple" ON private_messages;
DROP POLICY IF EXISTS "private_messages_insert_simple" ON private_messages;
DROP POLICY IF EXISTS "private_messages_update_simple" ON private_messages;
DROP POLICY IF EXISTS "private_messages_delete_simple" ON private_messages;

-- Notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
DROP POLICY IF EXISTS "notifications_select_simple" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_simple" ON notifications;
DROP POLICY IF EXISTS "notifications_update_simple" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_simple" ON notifications;

-- Friend Requests
DROP POLICY IF EXISTS "friend_requests_select" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_update" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_delete" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_select_simple" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_insert_simple" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_update_simple" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_delete_simple" ON friend_requests;

-- CVs
DROP POLICY IF EXISTS "cvs_select" ON cvs;
DROP POLICY IF EXISTS "cvs_insert" ON cvs;
DROP POLICY IF EXISTS "cvs_update" ON cvs;
DROP POLICY IF EXISTS "cvs_delete" ON cvs;
DROP POLICY IF EXISTS "cvs_select_simple" ON cvs;
DROP POLICY IF EXISTS "cvs_insert_simple" ON cvs;
DROP POLICY IF EXISTS "cvs_update_simple" ON cvs;
DROP POLICY IF EXISTS "cvs_delete_simple" ON cvs;

-- CV Skills
DROP POLICY IF EXISTS "cv_skills_select" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_insert" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_update" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_delete" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_select_simple" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_insert_simple" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_update_simple" ON cv_skills;
DROP POLICY IF EXISTS "cv_skills_delete_simple" ON cv_skills;

-- CV Experiences
DROP POLICY IF EXISTS "cv_experiences_select" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_insert" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_update" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_delete" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_select_simple" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_insert_simple" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_update_simple" ON cv_experiences;
DROP POLICY IF EXISTS "cv_experiences_delete_simple" ON cv_experiences;

-- CV Educations
DROP POLICY IF EXISTS "cv_educations_select" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_insert" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_update" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_delete" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_select_simple" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_insert_simple" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_update_simple" ON cv_educations;
DROP POLICY IF EXISTS "cv_educations_delete_simple" ON cv_educations;

-- Test
SELECT 'All RLS policies disabled successfully' as status;
