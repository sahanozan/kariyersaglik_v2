-- Test Rating Data in Survey Responses
-- Run this in Supabase Dashboard to check rating data

-- 1. Check all survey responses
SELECT 
    post_id,
    user_id,
    question_index,
    question_text,
    selected_option,
    rating_value,
    answer_text,
    created_at
FROM survey_responses 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check specifically rating responses
SELECT 
    post_id,
    question_index,
    question_text,
    rating_value,
    COUNT(*) as count
FROM survey_responses 
WHERE rating_value IS NOT NULL
GROUP BY post_id, question_index, question_text, rating_value
ORDER BY post_id, question_index, rating_value;

-- 3. Check if there are any rating responses at all
SELECT COUNT(*) as total_rating_responses 
FROM survey_responses 
WHERE rating_value IS NOT NULL;

-- 4. Check data types and values
SELECT 
    rating_value,
    pg_typeof(rating_value) as data_type,
    COUNT(*) as count
FROM survey_responses 
WHERE rating_value IS NOT NULL
GROUP BY rating_value, pg_typeof(rating_value)
ORDER BY rating_value;

-- 5. Check for any anket_yanıtları table data
SELECT 
    post_id,
    question_index,
    rating_value,
    COUNT(*) as count
FROM anket_yanıtları 
WHERE rating_value IS NOT NULL
GROUP BY post_id, question_index, rating_value
ORDER BY post_id, question_index, rating_value;






