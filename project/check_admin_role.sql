-- Admin kullanıcısının role'ünü kontrol et
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_blocked,
  created_at
FROM profiles 
WHERE email = 'ozansahan@outlook.com';

-- Eğer role 'admin' değilse, güncelle
UPDATE profiles 
SET 
  role = 'admin',
  updated_at = now()
WHERE email = 'ozansahan@outlook.com';

-- Güncelleme sonrası kontrol
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_blocked,
  updated_at
FROM profiles 
WHERE email = 'ozansahan@outlook.com';





