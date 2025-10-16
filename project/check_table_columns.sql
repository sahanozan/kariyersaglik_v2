-- Check all table columns to identify correct column names

-- Check job_listings table
SELECT 'job_listings' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'job_listings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check posts table
SELECT 'posts' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check comments table
SELECT 'comments' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check likes table
SELECT 'likes' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'likes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check chat_messages table
SELECT 'chat_messages' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check private_messages table
SELECT 'private_messages' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'private_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check notifications table
SELECT 'notifications' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check friend_requests table
SELECT 'friend_requests' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'friend_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check cvs table
SELECT 'cvs' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cvs' 
AND table_schema = 'public'
ORDER BY ordinal_position;