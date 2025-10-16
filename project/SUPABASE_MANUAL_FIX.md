# 🔧 SUPABASE MANUEL DÜZELTME TALİMATLARI

## ❌ Mevcut Hata
```
Error fetching messages: {"code":"42703","details":null,"hint":null,"message":"column chat_messages.is_pinned does not exist"}
```

## 🎯 Çözüm: Supabase Dashboard Üzerinden Manuel SQL

### 1. Supabase Dashboard'a Giriş
1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin: `imqcxaxvjnvhkojyxuyz`
3. Sol menüden **SQL Editor**'a tıklayın

### 2. SQL Komutlarını Çalıştırın

Aşağıdaki SQL komutlarını **tek tek** çalıştırın:

#### A) Eksik Kolonları Ekleyin
```sql
-- 1. expires_at kolonu ekle
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2. is_pinned kolonu ekle
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- 3. pinned_at kolonu ekle
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

-- 4. pinned_by kolonu ekle
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES profiles(id);
```

#### B) Index'leri Oluşturun
```sql
-- Performance için index'ler
CREATE INDEX IF NOT EXISTS idx_chat_messages_expires_at ON chat_messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_pinned ON chat_messages(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_pinned ON chat_messages(room_id, is_pinned) WHERE is_pinned = true;
```

#### C) Pin Fonksiyonunu Oluşturun
```sql
-- Pin message function
CREATE OR REPLACE FUNCTION pin_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
  room_id text;
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
    RAISE EXCEPTION 'Unauthorized: Only admin and moderators can pin messages';
  END IF;
  
  -- Get the room_id for the message
  SELECT room_id INTO room_id FROM chat_messages WHERE id = message_id;
  
  IF room_id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Unpin all other messages in the same room first (max 3 pins per room)
  UPDATE chat_messages 
  SET is_pinned = false, pinned_at = null, pinned_by = null
  WHERE room_id = room_id AND is_pinned = true;
  
  -- Pin the message
  UPDATE chat_messages 
  SET 
    is_pinned = true,
    pinned_at = now(),
    pinned_by = auth.uid(),
    expires_at = null -- Pinned messages don't expire
  WHERE id = message_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
END;
$$;
```

#### D) Unpin Fonksiyonunu Oluşturun
```sql
-- Unpin message function
CREATE OR REPLACE FUNCTION unpin_chat_message(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_blocked boolean;
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
    RAISE EXCEPTION 'Unauthorized: Only admin and moderators can unpin messages';
  END IF;
  
  -- Unpin the message
  UPDATE chat_messages 
  SET 
    is_pinned = false,
    pinned_at = null,
    pinned_by = null,
    expires_at = now() + interval '24 hours' -- Set expiration when unpinned
  WHERE id = message_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or already deleted';
  END IF;
END;
$$;
```

#### E) Otomatik Silme Fonksiyonunu Oluşturun
```sql
-- Auto delete expired messages function
CREATE OR REPLACE FUNCTION auto_delete_expired_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages that are expired and not pinned
  UPDATE chat_messages 
  SET deleted_at = now(), deleted_by = null
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND deleted_at IS NULL 
    AND is_pinned = false;
END;
$$;
```

### 3. Yetki Verme
```sql
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION pin_chat_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION unpin_chat_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_delete_expired_messages() TO authenticated;
```

### 4. Test Etme
```sql
-- Test query
SELECT id, is_pinned, expires_at, pinned_at, pinned_by 
FROM chat_messages 
LIMIT 1;
```

## ✅ Başarı Kontrolü

SQL komutlarını çalıştırdıktan sonra:

1. **Uygulamayı yeniden başlatın**
2. **Chat odasına girin**
3. **Hata mesajı kaybolmalı**
4. **Admin/moderatör olarak mesajları pin yapabilmelisiniz**

## 🚨 Önemli Notlar

- SQL komutlarını **tek tek** çalıştırın
- Her komutun başarılı olduğunu kontrol edin
- Hata alırsanız, önceki komutları kontrol edin
- Uygulamayı yeniden başlatmayı unutmayın

## 📞 Destek

Eğer hala hata alırsanız:
1. Supabase Dashboard > Logs bölümünü kontrol edin
2. Hata mesajlarını paylaşın
3. SQL komutlarının çalışıp çalışmadığını kontrol edin
