-- Check existing tables and their structure
-- Run this in Supabase Dashboard to see what tables exist

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check if anket_yanıtları table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'anket_yanıtları' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if survey_responses table exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'survey_responses' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Show sample data from anket_yanıtları if it exists
SELECT COUNT(*) as record_count FROM anket_yanıtları;

-- 5. Show table structure
\d anket_yanıtları;






