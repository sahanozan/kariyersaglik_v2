-- Debug Survey Tables
-- Run these commands one by one in Supabase Dashboard to debug

-- 1. Check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%survey%' OR table_name LIKE '%anket%'
ORDER BY table_name;

-- 2. Check survey_responses table structure (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'survey_responses' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check anket_yanıtları table structure (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'anket_yanıtları' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any survey responses
SELECT COUNT(*) as total_responses FROM survey_responses;

-- 5. Check if there are any responses in anket_yanıtları
SELECT COUNT(*) as total_responses FROM anket_yanıtları;

-- 6. Show sample data from survey_responses (if exists)
SELECT * FROM survey_responses LIMIT 5;

-- 7. Show sample data from anket_yanıtları (if exists)
SELECT * FROM anket_yanıtları LIMIT 5;

-- 8. Check posts table for surveys
SELECT 
    id,
    title,
    post_type,
    questions
FROM posts 
WHERE post_type = 'anket'
LIMIT 5;






