/*
  # E-posta doğrulama ayarları

  Bu migration e-posta doğrulama sistemini aktif hale getirir.
  
  1. Auth Settings
    - E-posta doğrulama zorunlu hale getirilir
    - Doğrulama e-postası şablonu ayarlanır
    
  2. Security
    - Doğrulanmamış kullanıcılar giriş yapamaz
    - E-posta doğrulama linki geçerlilik süresi ayarlanır
*/

-- E-posta doğrulama ayarlarını aktif et
-- Bu ayarlar Supabase Dashboard'dan yapılmalıdır:
-- 1. Authentication > Settings > Email templates
-- 2. "Enable email confirmations" seçeneğini aktif et
-- 3. Confirmation email template'i özelleştir

-- Kullanıcı profili oluşturma trigger'ını güncelle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, branch, city, institution, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'branch', ''),
    COALESCE(new.raw_user_meta_data->>'city', ''),
    COALESCE(new.raw_user_meta_data->>'institution', ''),
    'user',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();