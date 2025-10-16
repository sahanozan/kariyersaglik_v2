-- Kullanıcıyı ve tüm ilişkili verileri kalıcı olarak silen fonksiyon
CREATE OR REPLACE FUNCTION delete_user_permanently(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role text;
BEGIN
    -- Çağıran kullanıcının rolünü kontrol et
    SELECT role INTO caller_role 
    FROM public.profiles 
    WHERE id = auth.uid();

    -- Sadece admin ve moderatörler bu fonksiyonu çalıştırabilir
    IF caller_role NOT IN ('admin', 'moderator') THEN
        RAISE EXCEPTION 'Bu işlem için yetkiniz yok';
    END IF;

    -- Hedef kullanıcının rolünü kontrol et
    IF EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = user_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admin kullanıcılar silinemez';
    END IF;

    -- İlişkili tüm verileri sil
    DELETE FROM public.posts WHERE user_id = user_id;
    DELETE FROM public.job_listings WHERE user_id = user_id;
    DELETE FROM public.job_applications WHERE user_id = user_id;
    DELETE FROM public.event_registrations WHERE user_id = user_id;
    DELETE FROM public.chat_messages WHERE sender_id = user_id;
    DELETE FROM public.chat_rooms WHERE created_by = user_id;
    DELETE FROM public.surveys WHERE created_by = user_id;
    DELETE FROM public.survey_responses WHERE user_id = user_id;
    DELETE FROM public.ratings WHERE user_id = user_id OR rated_user_id = user_id;
    DELETE FROM public.post_likes WHERE user_id = user_id;
    DELETE FROM public.push_tokens WHERE user_id = user_id;
    DELETE FROM public.notifications WHERE user_id = user_id;
    DELETE FROM public.friend_requests WHERE sender_id = user_id OR receiver_id = user_id;
    DELETE FROM public.cvs WHERE user_id = user_id;

    -- Profil verisini sil
    DELETE FROM public.profiles WHERE id = user_id;

    -- Son olarak auth.users tablosundan kullanıcıyı sil
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Fonksiyon için yetkilendirme ayarları
REVOKE ALL ON FUNCTION delete_user_permanently(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_permanently(UUID) TO authenticated;