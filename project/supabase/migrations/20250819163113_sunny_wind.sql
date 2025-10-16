/*
  # Profil fotoğrafı için avatar_url sütunu ekle

  1. Yeni Sütun
    - `avatar_url` (text, nullable) - Profil fotoğrafı URL'si

  2. Güncelleme
    - Mevcut profiles tablosuna avatar_url sütunu eklenir
    - Varsayılan değer null olarak ayarlanır
*/

-- Avatar URL sütunu ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;